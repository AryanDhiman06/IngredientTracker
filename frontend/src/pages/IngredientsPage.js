import React, {useState, useEffect} from 'react';

const IngredientsPage = () => {
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        expiryDate: '',
        quantity: '',
        category: ''
    });

    const FLASK_API = 'http://localhost:5000';

    useEffect(() => {
        fetchIngredients()
    }, []);

    const fetchIngredients = async () => {
        try{
            const response = await fetch(`${FLASK_API}/api/ingredients`);
            const data = await response.json();
            setIngredients(data);
        } catch (error){
            console.error('Error fetching ingredients:', error);
        } finally{
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try{
            const url = editingIngredient ? `${FLASK_API}/api/ingredients/${editingIngredient.id}` : `${FLASK_API}/api/ingredients`;
            const method = editingIngredient ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if(response.ok){
                await fetchIngredients();
                resetForm();
            }else{
                const error = await response.json();
                alert(error.error || 'Error saving ingredient');
            }
        } catch (error){
            console.error('Error saving ingredient:', error);
            alert('Error saving ingredient');
        }
    };

    const handleEdit = (ingredient) => {
        setEditingIngredient(ingredient);
        setFormData({
            name: ingredient.name,
            expiryDate: ingredient.expiryDate,
            quantity: ingredient.quantity || '',
            category: ingredient.category || ''
        });
        setShowAddForm(true);
    };

    const handleDelete = async (id) => {
        if(!window.confirm('Are you sure you want to delete this ingredient')){
            return;
        }

        try{
            const response = await fetch(`${FLASK_API}/api/ingredients/${id}`, {
                method: 'DELETE'
            });

            if(response.ok){
                await fetchIngredients();
            }else{
                const error = await response.json();
                alert(error.error || 'Error deleting ingredient');
            }
        } catch (error){
            console.error('Error deleting ingredient:', error);
            alert('Error deleting ingredient');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            expiryDate: '',
            quantity: '',
            category: ''
        });
        setShowAddForm(false);
        setEditingIngredient(null);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const getStatusColor = (status) => {
        return status;
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
        return <div className='loading'>Loading ingredients...</div>
    }

    return (
        <div className='ingredients-page'>
            <div className='page-header'>
                <h2>Manage Ingredients</h2>
                <button
                    className='btn btn-primary'
                    onClick={() => setShowAddForm(true)}
                >
                    Add Ingredient
                </button>
            </div>

            {showAddForm && (
                <div className='form-overlay'>
                    <div className='form-modal'>
                        <h3>{editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className='form-group'>
                                <label>Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className='form-group'>
                                <label>Expiry Date *</label>
                                <input
                                    type="date"
                                    name="expiryDate"
                                    value={formData.expiryDate}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className='form-group'>
                                <label>quantity</label>
                                <input
                                    type="text"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 1 gallon, 500g, 6 pieces"
                                />
                            </div>
                            <div className='form-group'>
                                <label>Category</label>
                                <input
                                    type="text"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    placeholder='e.g., Dairy, Meat, Fruit'
                                />
                            </div>
                            <div className='form-buttons'>
                                <button type='button' onClick={resetForm} className='btn btn-secondary'>
                                    Cancel
                                </button>
                                <button type="submit" className='btn btn-primary'>
                                    {editingIngredient ? 'Update' : 'Add'} Ingredient
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className='ingredients-container'>
                {ingredients.length === 0 ? (
                    <p className='no-ingredients'>No ingredients added yet. Add your first ingredient to get started!</p>
                ) : (
                    <div className='ingredients-grid'>
                        {ingredients.map(ingredient => (
                            <div key={ingredient.id} className={`ingredient-card ${getStatusColor(ingredient.status)}`}>
                                <div className='ingredient-header'>
                                    <h4>{ingredient.name}</h4>
                                    <div className='ingredient-actions'>
                                        <button onClick={() => handleEdit(ingredient)} className='btn-icon edit'>
                                            ✏️
                                        </button>
                                        <button onClick={() => handleDelete(ingredient.id)} className='btn-icon delete'>
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                <div className='ingredient-details'>
                                    <p><strong>Quantity:</strong> {ingredient.quantity || 'Not specified'}</p>
                                    <p><strong>Category:</strong> {ingredient.category || 'Not specified'}</p>
                                    <p><strong>Expires:</strong> {ingredient.expiryDate}</p>
                                    <p className={`status ${ingredient.status}`}>
                                        <strong>{formatDaysLeft(ingredient.daysUntilExpiry, ingredient.status)}</strong>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IngredientsPage;