import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiChevronRight, FiEdit2, FiCamera, FiSave, FiTrash2 } from 'react-icons/fi';
import { FaUser } from 'react-icons/fa';

const Profile = () => {
	const navigate = useNavigate();
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
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState('');

	const authBaseUrl = useMemo(
		() => import.meta.env.VITE_AUTH_URL?.replace(/\/$/, '') || 'http://localhost:5001',
		[],
	);

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
				if (isEditing) {
					// Store in editedData during edit mode
					setEditedData(prev => ({
						...prev,
						profilePicture: reader.result
					}));
				} else {
					// Direct update if not in edit mode
					setUserData(prev => ({
						...prev,
						profilePicture: reader.result
					}));
					const updatedData = { ...userData, profilePicture: reader.result };
					localStorage.setItem('userData', JSON.stringify(updatedData));
				}
			};
			reader.readAsDataURL(file);
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
			const updatedData = { ...userData, profilePicture: null };
			localStorage.setItem('userData', JSON.stringify(updatedData));
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-600 to-black">
			{/* Profile Content */}
			<div className="max-w-4xl mx-auto px-6 py-8">
				{/* Profile Picture Section */}
				<div className="bg-white rounded-2xl shadow-md p-8 mb-6 relative">
					{/* Cancel Button */}
					<button 
						onClick={() => navigate(-1)}
						className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
					>
						<FiX className="w-6 h-6 text-gray-700" />
					</button>

					{/* Centered Title */}
					<h1 className="text-2xl font-bold text-gray-900 text-center mb-8">User Profile</h1>

					<div className="flex flex-col items-center">
						{/* Profile Picture */}
						<div className="relative mb-4">
							<div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden border-4 border-gray-200">
								{(isEditing ? editedData.profilePicture : userData.profilePicture) ? (
									<img 
										src={isEditing ? editedData.profilePicture : userData.profilePicture} 
										alt="Profile" 
										className="w-full h-full object-cover"
									/>
								) : (
									<FaUser className="w-16 h-16 text-gray-500" />
								)}
							</div>
							<label 
								htmlFor="profile-picture-input"
								className="absolute bottom-0 right-0 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 cursor-pointer transition-colors shadow-lg"
							>
								<FiCamera className="w-5 h-5" />
								<input 
									type="file" 
									id="profile-picture-input"
									accept="image/*"
									onChange={handleProfilePictureChange}
									className="hidden"
								/>
							</label>
							{(isEditing ? editedData.profilePicture : userData.profilePicture) && (
								<button
									onClick={handleRemoveProfilePicture}
								className="absolute bottom-0 left-0 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 cursor-pointer transition-colors shadow-lg"
									title="Remove profile picture"
								>
									<FiTrash2 className="w-5 h-5" />
								</button>
							)}
						</div>

						<p className="text-sm text-gray-600 mb-6">Edit Profile Picture</p>

						{/* User Information */}
						<div className="w-full space-y-4 mb-6">
							<div className="flex items-center justify-between py-3 border-b border-gray-200">
								<span className="text-gray-600 font-medium">User name</span>
								{isEditing ? (
									<input
										type="text"
										value={editedData.username}
										onChange={handleUsernameChange}
										className="text-gray-900 font-semibold text-right border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-gray-800"
										placeholder="Enter username"
									/>
								) : (
									<span className="text-gray-900 font-semibold">
										{userData.username || 'Not set'}
									</span>
								)}
							</div>
							<div className="flex items-center justify-between py-3 border-b border-gray-200">
								<span className="text-gray-600 font-medium">Email</span>
								<span className="text-gray-900 font-semibold text-sm">
									{userData.email || 'Not set'}
								</span>
							</div>
							<div className="flex items-center justify-between py-3 border-b border-gray-200">
								<span className="text-gray-600 font-medium">User ID</span>
								<span className="text-gray-900 font-semibold text-xs">
									{userData.userId || 'Not set'}
								</span>
							</div>
							<div className="flex items-center justify-between py-3 border-b border-gray-200">
								<span className="text-gray-600 font-medium">Phone</span>
								{isEditing ? (
									<input
										type="tel"
										value={editedData.phone}
										onChange={handlePhoneChange}
										className="text-gray-900 font-semibold text-right border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-gray-800"
										placeholder="Enter phone number"
									/>
								) : (
									<span className="text-gray-900 font-semibold">
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
				<div className="bg-white rounded-2xl shadow-md overflow-hidden">
					<button 
						onClick={handleItineraryHistory}
						className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors border-b border-gray-100"
					>
						<span className="text-gray-900 font-semibold text-lg">Itinerary history</span>
						<FiChevronRight className="w-6 h-6 text-gray-400" />
					</button>
					<button 
						onClick={handleResetPassword}
						className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
					>
						<span className="text-gray-900 font-semibold text-lg">Reset Password</span>
						<FiChevronRight className="w-6 h-6 text-gray-400" />
					</button>
				</div>
			</div>
		</div>
	);
};

export default Profile;
