import React, {useState, useEffect} from 'react';

const RecipesPage = () => {
    const [recipes, setRecipes] = useState([]);
    const [expiringIngredients, setExpiringIngredients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [daysFilter, setDaysFilter] = useState(7);

    const FLASK_API = 'http://localhost:5000';

    useEffect(() => {
        fetchRecipeSuggestions();
    }, [daysFilter]);

    const fetchRecipeSuggestions = async () => {
        setLoading(true);
        setError(null);
        setMessage('');

        try{
            const response = await fetch(`${FLASK_API}/api/recipe-suggestions?days=${daysFilter}`);
            const data = await response.json();

            if(response.ok){
                setRecipes(data.recipes || []);
                setExpiringIngredients(data.expiringIngredients || []);
                setMessage(data.message || '');
            }else{
                setError(data.error || 'Failed to fetch recipes');
                setRecipes([]);
                setExpiringIngredients(data.expiringIngredients || []);
            }
        } catch (error) {
            console.error('Error fetching recipes:', error);
            setError('Failed to connect to the server');
            setRecipes([]);
            setExpiringIngredients([]);
        } finally{
            setLoading(false);
        }
    };

    const handleRecipeClick = (recipe) => {
        setSelectedRecipe(recipe);
    };

    const closeRecipeModal = () => {
        setSelectedRecipe(null);
    };

    const getIngredientMatchText = (recipe) => {
        const used = recipe.usedIngredientCount || 0;
        const missed = recipe.missedIngredientCount || 0;
        const total = used + missed;

        if(total === 0){
            return 'No ingredient info';
        }

        const percentage = Math.round((used / total) * 100);
        return `${used}/${total} ingredients (${percentage}% match)`;
    };

    const getMatchColor = (recipe) => {
        const used = recipe.usedIngredientCount || 0;
        const missed = recipe.missedIngredientCount || 0;
        const total = used + missed;

        if(total === 0){
            return 'low';
        }

        const percentage = (used / total) * 100;
        if(percentage >= 80){
            return 'high';
        }
        if(percentage >= 50){
            return 'medium';
        }
        return 'low';
    };

    return (
        <div className='recipes-page'>
            <div className='page-header'>
                <h2>Recipe Suggestions</h2>
                <div className='filter-controls'>
                    <label htmlFor='days-filter'>Days until expiry:</label>
                    <select
                        id='days-filter'
                        value={daysFilter}
                        onChange={(e) => setDaysFilter(parseInt(e.target.value))}
                        className='filter-select'
                    >
                        <option value={3}>3 days</option>
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                        <option value={30}>30 days</option>
                    </select>
                    <button
                        onClick={fetchRecipeSuggestions}
                        className='btn btn-primary'
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Refresh Recipes'}
                    </button>
                </div>
            </div>

            {expiringIngredients.length > 0 && (
                <div className='expiring-ingredients-section'>
                    <h3>Ingredients Expiring Soon</h3>
                    <div className='ingredients-chips'>
                        {expiringIngredients.map((ingredient, index) => (
                            <span key={index} className='ingredient-chip'>
                                {ingredient}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {loading && (
                <div className='loading'>
                    <div className='loading-spinner'></div>
                    Finding recipes with your ingredients...
                </div>
            )}

            {error && (
                <div className='error-message'>
                    <p>{error}</p>
                    <button onClick={fetchRecipeSuggestions} className='btn btn-secondary'>
                        Try Again
                    </button>
                </div>
            )}

            {!loading && !error && message && (
                <div className='info-message'>
                    <p>{message}</p>
                </div>
            )}

            {!loading && !error && recipes.length > 0 && (
                <div className='recipes-container'>
                    <div className='recipes-grid'>
                        {recipes.map((recipe) => (
                            <div
                                key={recipe.id}
                                className='recipe-card'
                                onClick={() => handleRecipeClick(recipe)}
                            >
                                {recipe.image && (
                                    <div className='recipe-image'>
                                        <img src={recipe.image} alt={recipe.title} />
                                    </div>
                                )}
                                <div className='recipe-content'>
                                    <h4 className='recipe-title'>{recipe.title}</h4>
                                    <div className='recipe-meta'>
                                        <span className='recipe-time'>
                                            ⏱️ {recipe.readyInMinutes} min
                                        </span>
                                        <span className='recipe-servings'>
                                            👥 {recipe.servings} servings
                                        </span>
                                    </div>

                                    <div className={`ingredient-match ${getMatchColor(recipe)}`}>
                                        {getIngredientMatchText(recipe)}
                                    </div>

                                    {recipe.usedIngredients && recipe.usedIngredients.length > 0 && (
                                        <div className='used-ingredients'>
                                            <strong>You have:</strong>
                                            <div className='ingredient-tags'>
                                                {recipe.usedIngredients.slice(0, 3).map((ingredient, index) => (
                                                    <span key={index} className='ingredient-tag used'>
                                                        {ingredient}
                                                    </span>
                                                ))}
                                                {recipe.usedIngredients.length > 3 && (
                                                    <span className='ingredient-tag more'>
                                                        +{recipe.usedIngredients.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {recipe.missedIngredients && recipe.missedIngredients.length > 0 && (
                                        <div className='missed-ingredients'>
                                            <strong>You need:</strong>
                                            <div className='ingredient-tags'>
                                                {recipe.missedIngredients.slice(0, 3).map((ingredient, index) => (
                                                    <span key={index} className='ingredient-tag missed'>
                                                        {ingredient}
                                                    </span>
                                                ))}
                                                {recipe.missedIngredients.length > 3 && (
                                                    <span className='ingredient-tag more'>
                                                        +{recipe.missedIngredients.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {recipe.summary && (
                                        <p className='recipe-summary'>
                                            {recipe.summary}
                                        </p>
                                    )}

                                    <div className='recipe-actions'>
                                        <button className='btn btn-primary btn-small'>
                                            View Recipes
                                        </button>
                                        {recipe.sourceUrl && (
                                            <a
                                                href={recipe.sourceUrl}
                                                target='_blank'
                                                rel="noopener noreferrer"
                                                className='btn btn-secondary btn-small'
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Original Source
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!loading && !error && recipes.length === 0 && expiringIngredients.length === 0 && (
                <div className='no-recipes'>
                    <div className='no-recipes-icon'>🍳</div>
                    <h3>No ingredients expiring soon</h3>
                    <p>Add some ingredients to your pantry to get personalized recipe suggestions!</p>
                </div>
            )}

            {!loading && !error && recipes.length === 0 && expiringIngredients.length > 0 && (
                <div className='no-recipes'>
                    <div className='no-recipes-icon'>🔍</div>
                    <h3>No recipes found</h3>
                    <p>Try adding more common ingredients to get better recipe matches, or increase the expiry day filter.</p>
                </div>
            )}

            {selectedRecipe && (
                <div className='form-overlay' onClick={closeRecipeModal}>
                    <div className='recipe-modal' onClick={(e) => e.stopPropagation()}>
                        <div className='recipe-modal-header'>
                            <h2>{selectedRecipe.title}</h2>
                            <button onClick={closeRecipeModal} className='btn-close'>
                                ✕
                            </button>
                        </div>

                        <div className='recipe-modal-content'>
                            {selectedRecipe.image && (
                                <div className='recipe-modal-image'>
                                    <img src={selectedRecipe.image} alt={selectedRecipe.title} />
                                </div>
                            )}

                            <div className='recipe-modal-meta'>
                                <div className='meta-item'>
                                    <strong>⏱️ Prep Time:</strong> {selectedRecipe.readyInMinutes} minutes
                                </div>
                                <div className='meta-item'>
                                    <strong>👥 Servings:</strong> {selectedRecipe.servings}
                                </div>
                                <div className='meta-item'>
                                    <strong>🥘 Match:</strong> {getIngredientMatchText(selectedRecipe)}
                                </div>
                            </div>

                            {selectedRecipe.summary && (
                                <div className='recipe-section'>
                                    <h4>About This Recipe</h4>
                                    <p>{selectedRecipe.summary}</p>
                                </div>
                            )}

                            <div className='ingredients-section'>
                                {selectedRecipe.usedIngredients && selectedRecipe.usedIngredients.length > 0 && (
                                    <div className='ingredients-group'>
                                        <h4>✅ Ingredients You Have</h4>
                                        <div className='ingredient-tags'>
                                            {selectedRecipe.usedIngredients.map((ingredient, index) => (
                                                <span key={index} className='ingredient-tag used'>
                                                    {ingredient}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedRecipe.missedIngredients && selectedRecipe.missedIngredients.length > 0 && (
                                    <div className='ingredients-group'>
                                        <h4>🛒 Ingredients You Need</h4>
                                        <div className='ingredient-tags'>
                                            {selectedRecipe.missedIngredients.map((ingredient, index) => (
                                                <span key={index} className='ingredient-tag missed'>
                                                    {ingredient}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
                                <div className='recipe-section'>
                                    <h4>instructions</h4>
                                    <ol className='instructions-list'>
                                        {selectedRecipe.instructions.map((instruction, index) => (
                                            <li key={index} className='instruction-step'>
                                                {instruction.step}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            <div className='recipe-modal-actions'>
                                {selectedRecipe.sourceUrl && (
                                    <a
                                        href={selectedRecipe.sourceUrl}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='btn btn-primary'
                                    >
                                        View Original Recipe
                                    </a>
                                )}
                                <button onClick={closeRecipeModal} className='btn btn-secondary'>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecipesPage;