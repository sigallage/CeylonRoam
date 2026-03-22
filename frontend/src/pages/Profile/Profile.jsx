import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiChevronRight, FiEdit2, FiCamera, FiSave, FiTrash2 } from 'react-icons/fi';
import { getAuthBaseUrl } from '../../config/backendUrls';
import { useTheme } from '../../context/ThemeContext';

const Profile = () => {
	const navigate = useNavigate();
	const { isDarkMode } = useTheme();
	const [userData, setUserData] = useState({
		username: '',
		userId: '',
		phone: '',
		email: '',
		profilePicture: null
	});
	const [isEditing, setIsEditing] = useState(false);
	const [editedData, setEditedData] = useState({
		username: '',
		phone: '',
		profilePicture: null
	});
	const [isProfilePicMenuOpen, setIsProfilePicMenuOpen] = useState(false);
	const fileInputRef = useRef(null);
	const profilePicContainerRef = useRef(null);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState('');
	const profileInitial = ((isEditing ? editedData.username : userData.username)?.trim()?.charAt(0)
		|| userData.email?.trim()?.charAt(0)
		|| 'U').toUpperCase();

	const authBaseUrl = useMemo(() => getAuthBaseUrl(), [])

	const panelClass = isDarkMode
		? 'bg-[#1f1f1f] border border-yellow-500/40 rounded-2xl shadow-md'
		: 'bg-white border border-yellow-500/30 rounded-2xl shadow-md';
	const hoverIconButtonClass = isDarkMode
		? 'absolute top-6 left-6 p-2 hover:bg-white/10 rounded-full transition-colors'
		: 'absolute top-6 left-6 p-2 hover:bg-black/5 rounded-full transition-colors';
	const iconClass = isDarkMode ? 'w-6 h-6 text-white/80' : 'w-6 h-6 text-gray-700';
	const titleClass = isDarkMode ? 'text-2xl font-bold text-yellow-400 text-center mb-8' : 'text-2xl font-bold text-yellow-600 text-center mb-8';
	const mutedTextClass = isDarkMode ? 'text-white/70' : 'text-gray-600';
	const labelTextClass = isDarkMode ? 'text-white/70 font-medium' : 'text-gray-700 font-medium';
	const valueTextClass = isDarkMode ? 'text-white font-semibold' : 'text-gray-900 font-semibold';
	const rowBorderClass = isDarkMode ? 'border-b border-white/10' : 'border-b border-gray-200';
	const editFieldClass = isDarkMode
		? 'bg-black/40 text-white font-semibold text-right border border-white/20 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-400'
		: 'bg-white text-gray-900 font-semibold text-right border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-amber-300';
	const menuButtonClass = isDarkMode
		? 'w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors'
		: 'w-full flex items-center justify-between p-5 hover:bg-black/5 transition-colors';
	const menuIconClass = isDarkMode ? 'w-6 h-6 text-white/60' : 'w-6 h-6 text-gray-500';

	useEffect(() => {
		// Load user data from localStorage (saved after login)
		const storedData = localStorage.getItem('ceylonroam_user');
		if (storedData) {
			try {
				const parsed = JSON.parse(storedData);
				// Extract user data from login response
				const user = parsed.user || parsed;
				setUserData({
					username: user.name || '',
					userId: user._id || '',
					phone: user.phone || '',
					email: user.email || '',
					profilePicture: user.profilePicture || null
				});
			} catch (error) {
				console.error('Error parsing user data:', error);
			}
		}
	}, []);

	useEffect(() => {
		const handleOutsideClick = (event) => {
			if (!profilePicContainerRef.current) return;
			if (!profilePicContainerRef.current.contains(event.target)) {
				setIsProfilePicMenuOpen(false);
			}
		};

		document.addEventListener('mousedown', handleOutsideClick);
		return () => document.removeEventListener('mousedown', handleOutsideClick);
	}, []);

	const handleEditProfile = () => {
		setIsEditing(true);
		setEditedData({
			username: userData.username,
			phone: userData.phone,
			profilePicture: userData.profilePicture
		});
		setSaveError('');
	};

	const handleSaveProfile = async () => {
		setIsSaving(true);
		setSaveError('');

		try {
			// Get token from localStorage
			const storedData = localStorage.getItem('ceylonroam_user');
			const parsed = JSON.parse(storedData);
			const token = parsed.token;

			// Call API to update profile
			const response = await fetch(`${authBaseUrl}/api/profile`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					name: editedData.username,
					phone: editedData.phone
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to update profile');
			}

			// Update local state with saved data
			const updatedUserData = {
				...userData,
				username: editedData.username,
				phone: editedData.phone,
				profilePicture: editedData.profilePicture
			};
			setUserData(updatedUserData);

			// Update localStorage with new data
			const updatedStoredData = {
				...parsed,
				user: {
					...parsed.user,
					name: editedData.username,
					phone: editedData.phone,
					profilePicture: editedData.profilePicture
				}
			};
			localStorage.setItem('ceylonroam_user', JSON.stringify(updatedStoredData));

			setIsEditing(false);
		} catch (error) {
			console.error('Error saving profile:', error);
			setSaveError(error.message || 'Failed to save profile. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancelEdit = () => {
		setIsEditing(false);
		setEditedData({
			username: userData.username,
			phone: userData.phone,
			profilePicture: userData.profilePicture
		});
		setSaveError('');
	};

	const handleResetPassword = () => {
		navigate('/reset-password');
	};

	const handleItineraryHistory = () => {
		navigate('/itinerary-history');
	};

	const handleProfilePictureChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				const nextProfilePicture = reader.result;
				if (isEditing) {
					// Store in editedData during edit mode
					setEditedData(prev => ({
						...prev,
						profilePicture: nextProfilePicture
					}));
				} else {
					// Direct update if not in edit mode
					setUserData(prev => ({
						...prev,
						profilePicture: nextProfilePicture
					}));
					try {
						const storedData = localStorage.getItem('ceylonroam_user');
						if (storedData) {
							const parsed = JSON.parse(storedData);
							const updatedStoredData = {
								...parsed,
								user: {
									...(parsed.user || {}),
									profilePicture: nextProfilePicture
								}
							};
							localStorage.setItem('ceylonroam_user', JSON.stringify(updatedStoredData));
						}
					} catch (error) {
						console.error('Error saving profile picture:', error);
					}
				}
				setIsProfilePicMenuOpen(false);
			};
			reader.readAsDataURL(file);
			// allow picking the same file again
			e.target.value = '';
		}
	};

	const handleUsernameChange = (e) => {
		setEditedData(prev => ({
			...prev,
			username: e.target.value
		}));
	};

	const handlePhoneChange = (e) => {
		setEditedData(prev => ({
			...prev,
			phone: e.target.value
		}));
	};

	const handleRemoveProfilePicture = () => {
		if (isEditing) {
			// Remove profile picture in edit mode
			setEditedData(prev => ({
				...prev,
				profilePicture: null
			}));
		} else {
			// Direct removal if not in edit mode
			setUserData(prev => ({
				...prev,
				profilePicture: null
			}));
			try {
				const storedData = localStorage.getItem('ceylonroam_user');
				if (storedData) {
					const parsed = JSON.parse(storedData);
					const updatedStoredData = {
						...parsed,
						user: {
							...(parsed.user || {}),
							profilePicture: null
						}
					};
					localStorage.setItem('ceylonroam_user', JSON.stringify(updatedStoredData));
				}
			} catch (error) {
				console.error('Error removing profile picture:', error);
			}
		}
		setIsProfilePicMenuOpen(false);
	};

	const openProfilePicturePicker = () => {
		fileInputRef.current?.click();
	};

	return (
		<div className="min-h-screen">
			{/* Profile Content */}
			<div className="max-w-4xl mx-auto px-6 py-8">
				{/* Profile Picture Section */}
				<div className={`${panelClass} p-8 mb-6 relative`}>
					{/* Cancel Button */}
					<button 
						onClick={() => navigate(-1)}
						className={hoverIconButtonClass}
					>
						<FiX className={iconClass} />
					</button>

					{/* Centered Title */}
					<h1 className={titleClass}>User Profile</h1>

					<div className="flex flex-col items-center">
						{/* Profile Picture */}
						<div className="relative mb-4">
							<input 
								type="file" 
								ref={fileInputRef}
								accept="image/*"
								onChange={handleProfilePictureChange}
								className="hidden"
							/>
							<div ref={profilePicContainerRef} className="relative">
								<button
									type="button"
									onClick={() => setIsProfilePicMenuOpen(prev => !prev)}
									className="w-32 h-32 rounded-full bg-yellow-100 flex items-center justify-center overflow-hidden border-4 border-yellow-200"
									aria-label="Profile picture"
								>
								{(isEditing ? editedData.profilePicture : userData.profilePicture) ? (
									<img 
										src={isEditing ? editedData.profilePicture : userData.profilePicture} 
										alt="Profile" 
										className="w-full h-full object-cover"
									/>
								) : (
									<span className="text-5xl font-bold text-gray-600">{profileInitial}</span>
								)}
								</button>
								{isProfilePicMenuOpen && (
									<>
										<button
											type="button"
											onClick={openProfilePicturePicker}
											className="absolute bottom-0 right-0 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 cursor-pointer transition-colors shadow-lg"
											aria-label="Upload profile picture"
										>
											<FiCamera className="w-5 h-5" />
										</button>
										{(isEditing ? editedData.profilePicture : userData.profilePicture) && (
											<button
												onClick={handleRemoveProfilePicture}
												className="absolute bottom-0 left-0 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 cursor-pointer transition-colors shadow-lg"
												title="Remove profile picture"
											>
												<FiTrash2 className="w-5 h-5" />
											</button>
										)}
									</>
								)}
							</div>
						</div>

						<p className={`text-sm mb-6 ${mutedTextClass}`}>Edit Profile Picture</p>

						{/* User Information */}
						<div className="w-full space-y-4 mb-6">
							<div className={`flex items-center justify-between py-3 px-24 ${rowBorderClass}`}>
								<span className={labelTextClass}>User name</span>
								{isEditing ? (
									<input
										type="text"
										value={editedData.username}
										onChange={handleUsernameChange}
										className={editFieldClass}
										placeholder="Enter username"
									/>
								) : (
									<span className={valueTextClass}>
										{userData.username || 'Not set'}
									</span>
								)}
							</div>
							<div className={`flex items-center justify-between py-3 px-24 ${rowBorderClass}`}>
								<span className={labelTextClass}>Email</span>
								<span className={valueTextClass}>
									{userData.email || 'Not set'}
								</span>
							</div>
							<div className={`flex items-center justify-between py-3 px-24 ${rowBorderClass}`}>
								<span className={labelTextClass}>User ID</span>
								<span className={valueTextClass}>
									{userData.userId || 'Not set'}
								</span>
							</div>
							<div className={`flex items-center justify-between py-3 px-24 ${rowBorderClass}`}>
								<span className={labelTextClass}>Phone</span>
								{isEditing ? (
									<input
										type="tel"
										value={editedData.phone}
										onChange={handlePhoneChange}
										className={editFieldClass}
										placeholder="Enter phone number"
									/>
								) : (
									<span className={valueTextClass}>
										{userData.phone || 'Not set'}
									</span>
								)}
							</div>
						</div>

						{/* Error Message */}
						{saveError && (
							<div className="w-full max-w-xs mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
								{saveError}
							</div>
						)}

						{/* Edit and Save Buttons */}
						<div className="w-full max-w-xs flex gap-3">
							{!isEditing ? (
								<button 
									onClick={handleEditProfile}
									className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
								>
									<FiEdit2 className="w-5 h-5" />
									Edit
								</button>
							) : (
								<>
									<button 
										onClick={handleCancelEdit}
										disabled={isSaving}
										className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Cancel
									</button>
									<button 
										onClick={handleSaveProfile}
										disabled={isSaving}
										className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<FiSave className="w-5 h-5" />
										{isSaving ? 'Saving...' : 'Save'}
									</button>
								</>
							)}
						</div>
					</div>
				</div>

				{/* Menu Options */}
				<div className={`${panelClass} overflow-hidden`}>
					<button 
						onClick={handleItineraryHistory}
						className={`${menuButtonClass} ${isDarkMode ? 'border-b border-white/10' : 'border-b border-gray-200'}`}
					>
						<span className={isDarkMode ? 'text-white font-semibold text-lg' : 'text-gray-900 font-semibold text-lg'}>Itinerary history</span>
						<FiChevronRight className={menuIconClass} />
					</button>
					<button 
						onClick={handleResetPassword}
						className={menuButtonClass}
					>
						<span className={isDarkMode ? 'text-white font-semibold text-lg' : 'text-gray-900 font-semibold text-lg'}>Reset Password</span>
						<FiChevronRight className={menuIconClass} />
					</button>
				</div>
			</div>
		</div>
	);
};

export default Profile;
