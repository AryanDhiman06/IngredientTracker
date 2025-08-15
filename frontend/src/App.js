import React, {useState} from 'react';
import DashboardPage from './pages/DashboardPage';
import IngredientsPage from './pages/IngredientsPage';
import RecipesPage from './pages/RecipesPage';
import './index.css'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch(currentPage){
      case 'dashboard':
        return <DashboardPage/>
      case 'ingredients':
        return <IngredientsPage/>
      case 'recipes':
        return <RecipesPage/>
      default:
        return <DashboardPage/>
    }
  };

  return (
    <div className='app'>
      <nav className='navbar'>
        <div className='nav-brand'>
          <h1>Ingredient Tracker</h1>
        </div>
        <div className='nav-links'>
          <button
            className={currentPage === 'dashboard' ? 'nav-button active' : 'nav-button'}
            onClick={() => setCurrentPage('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={currentPage === 'ingredients' ? 'nav-button active' : 'nav-button'}
            onClick={() => setCurrentPage('ingredients')}
          >
            Ingredients
          </button>
          <button
            className={currentPage === 'recipes' ? 'nav-button active' : 'nav-button'}
            onClick={() => setCurrentPage('recipes')}
          >
            Recipes
          </button>
        </div>
      </nav>
      <main className='main-content'>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
