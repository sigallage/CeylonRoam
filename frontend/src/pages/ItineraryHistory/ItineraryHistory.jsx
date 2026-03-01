import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiTrash2, FiCalendar, FiMapPin } from 'react-icons/fi';

const ItineraryHistory = () => {
	const navigate = useNavigate();
	const [itineraries, setItineraries] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const [deletingId, setDeletingId] = useState(null);

	const authBaseUrl = useMemo(
		() => import.meta.env.VITE_AUTH_URL?.replace(/\/$/, '') || 'http://localhost:5001',
		[],
	);

	useEffect(() => {
		fetchItineraries();
	}, []);

	const fetchItineraries = async () => {
		setIsLoading(true);
		setError('');

		try {
			const storedData = localStorage.getItem('ceylonroam_user');
			if (!storedData) {
				setError('Please log in to view your itineraries');
				setIsLoading(false);
				return;
			}

			const parsed = JSON.parse(storedData);
			const token = parsed.token;

			const response = await fetch(`${authBaseUrl}/api/itineraries`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to fetch itineraries');
			}

			setItineraries(result.itineraries || []);
		} catch (error) {
			console.error('Error fetching itineraries:', error);
			setError(error.message || 'Failed to load itineraries');
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteItinerary = async (id) => {
		if (!window.confirm('Are you sure you want to delete this itinerary?')) {
			return;
		}

		setDeletingId(id);

		try {
			const storedData = localStorage.getItem('ceylonroam_user');
			const parsed = JSON.parse(storedData);
			const token = parsed.token;

			const response = await fetch(`${authBaseUrl}/api/itineraries/${id}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to delete itinerary');
			}

			// Remove from local state
			setItineraries(itineraries.filter(item => item._id !== id));
		} catch (error) {
			console.error('Error deleting itinerary:', error);
			alert(error.message || 'Failed to delete itinerary');
		} finally {
			setDeletingId(null);
		}
	};

	const handleViewItinerary = (itinerary) => {
		// Navigate to Main page with itinerary data
		navigate('/main', { 
			state: { 
				aiResponse: itinerary.itineraryData 
			} 
		});
	};

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { 
			year: 'numeric', 
			month: 'short', 
			day: 'numeric' 
		});
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-600 to-black">
			<div className="max-w-6xl mx-auto px-6 py-8">
				<div className="bg-white rounded-2xl shadow-md p-8 relative">
					{/* Back Button */}
					<button 
						onClick={() => navigate(-1)}
						className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
					>
						<FiX className="w-6 h-6 text-gray-700" />
					</button>

					{/* Title */}
					<h1 className="text-2xl font-bold text-gray-900 text-center mb-8">Itinerary History</h1>

					{/* Loading State */}
					{isLoading && (
						<div className="text-center py-12">
							<p className="text-gray-600">Loading your itineraries...</p>
						</div>
					)}

					{/* Error State */}
					{error && !isLoading && (
						<div className="text-center py-12">
							<p className="text-red-600 mb-4">{error}</p>
							<button 
								onClick={fetchItineraries}
								className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
							>
								Try Again
							</button>
						</div>
					)}

					{/* Empty State */}
					{!isLoading && !error && itineraries.length === 0 && (
						<div className="text-center py-12">
							<p className="text-gray-600 mb-4">You haven't saved any itineraries yet.</p>
							<button 
								onClick={() => navigate('/planner')}
								className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl transition-colors"
							>
								Create Your First Itinerary
							</button>
						</div>
					)}

					{/* Itineraries List */}
					{!isLoading && !error && itineraries.length > 0 && (
						<div className="space-y-4">
							{itineraries.map((itinerary) => (
								<div 
									key={itinerary._id}
									className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
								>
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<h3 className="text-lg font-semibold text-gray-900 mb-2">
												{itinerary.title}
											</h3>
											<div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
												<div className="flex items-center gap-2">
													<FiMapPin className="w-4 h-4" />
													<span>{itinerary.destination}</span>
												</div>
												<div className="flex items-center gap-2">
													<FiCalendar className="w-4 h-4" />
													<span>
														{formatDate(itinerary.startDate)} - {formatDate(itinerary.endDate)}
													</span>
												</div>
												<span className="text-gray-500">
													{itinerary.numberOfDays} {itinerary.numberOfDays === 1 ? 'day' : 'days'}
												</span>
											</div>
											{itinerary.budget && (
												<p className="text-sm text-gray-600">
													<span className="font-medium">Budget:</span> {itinerary.budget} LKR
												</p>
											)}
											<p className="text-xs text-gray-500 mt-2">
												Created: {formatDate(itinerary.createdAt)}
											</p>
										</div>
										<div className="flex gap-2 ml-4">
											<button
												onClick={() => handleViewItinerary(itinerary)}
												className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
											>
												View
											</button>
											<button
												onClick={() => handleDeleteItinerary(itinerary._id)}
												disabled={deletingId === itinerary._id}
												className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												title="Delete itinerary"
											>
												<FiTrash2 className="w-5 h-5" />
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ItineraryHistory;
