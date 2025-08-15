import React, {useState, useEffect} from 'react';

const DashboardPage = () => {
    const [stats, setStats] = useState({
        totalIngredients: 0,
        expired: 0,
        expiringSoon: 0,
        fresh: 0
    });

    const [expiringIngredients, setExpiringIngredients] = useState([]);
    const [loading, setLoading] = useState(true);

    const FLASK_API = 'http://localhost:5000';

    useEffect(() => {
        fetchStats();
        fetchExpiringIngredients();
    }, []);

    const fetchStats = async () => {
        try{
            const response = await fetch(`${FLASK_API}/api/stats`);
            const data = await response.json();
            setStats(data);
        }catch (error){
            console.error('Error fetching stats:', error);
        }
    };

    const fetchExpiringIngredients = async () => {
        try{
            const response = await fetch(`${FLASK_API}/api/expiring?days=7`);
            const data = await response.json();
            setExpiringIngredients(data);
        }catch (error){
            console.error('Error fetching expiring ingredients:', error);
        }finally {
            setLoading(false);
        }
    };

    const getStatusColor = (daysUntilExpiry) => {
        if(daysUntilExpiry < 0){
            return 'expired';
        }
        if(daysUntilExpiry <= 3){
            return 'expiring-soon';
        }
        if(daysUntilExpiry <= 7){
            return 'expiring-week'
        }
        return 'fresh';
    };

    const formatDaysLeft = (days, status) => {
        if(status === 'expired'){
            const daysExpired = Math.abs(days);
            if(daysExpired === 1){
                return 'Expired 1 day ago';
            }
            return `Expired ${daysExpired} days ago`;
        }
        if(days === 0){
            return 'Expires today';
        }
        if(days === 1){
            return '1 day left';
        }
        return `${days} days left`;
    };

    if(loading){
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard">
            <h2>Dashboard</h2>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Ingredients</h3>
                    <div className='stat-number'>{stats.totalIngredients}</div>
                </div>
                <div className='stat-card fresh'>
                    <h3>Fresh</h3>
                    <div className='stat-number'>{stats.fresh}</div>
                </div>
                <div className='stat-card expiring'>
                    <h3>Expiring Soon</h3>
                    <div className='stat-number'>{stats.expiringSoon}</div>
                </div>
                <div className='stat-card expired'>
                    <h3>Expired</h3>
                    <div className='stat-number'>{stats.expired}</div>
                </div>
            </div>

            <div className="expiring-section">
                <h3>Ingredients Expiring This Week</h3>
                {expiringIngredients.length === 0 ? (
                    <p className='no-ingredients'>No ingredients expiring in the next 7 days!</p>
                ) : (
                    <div className='ingredients-list'>
                        {expiringIngredients.map(ingredient => (
                            <div key={ingredient.id} className={`ingredient-card ${getStatusColor(ingredient.daysUntilExpiry)}`}>
                                <div className='ingredient-info'>
                                    <h4>{ingredient.name}</h4>
                                    <p className='ingredient-details'>
                                        {ingredient.quantity} • {ingredient.category}
                                    </p>
                                    <p className='expiry-date'>Expires: {ingredient.expiryDate}</p>
                                </div>
                                <div className='days-left'>
                                    {formatDaysLeft(ingredient.daysUntilExpiry, getStatusColor(ingredient.daysUntilExpiry))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;