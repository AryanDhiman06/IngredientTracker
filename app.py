from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
import datetime
from contextlib import contextmanager
import requests
import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)
DATABASE = 'ingredients.db'

SPOONACULAR_API_KEY = os.getenv('SPOONACULAR_API_KEY')

@contextmanager
def get_db_connection():
    con = sqlite3.connect(DATABASE)
    con.row_factory = sqlite3.Row
    try:
        yield con
    finally:
        con.close()

def init_database():
    with get_db_connection() as con:
        con.execute('''
            CREATE TABLE IF NOT EXISTS ingredients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                expiryDate DATE NOT NULL,
                quantity TEXT,
                category TEXT,
                dateAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        con.commit()

def daysUntilExpiry(expiryDate):
    try:
        expiry = datetime.datetime.strptime(expiryDate, '%Y-%m-%d').date()
        today = datetime.date.today()
        change = expiry - today
        return change.days
    except:
        return None
    
def getRecipesFromSpoonacular(ingredients: List[str], numberOfRecipies: int = 10):
    try:
        if not SPOONACULAR_API_KEY:
            return None, "Spoonacular API key not configured. Please add SPOONACULAR_API_KEY to your .env file"
        
        ingredientsStr = ','.join(ingredients)
        
        url = "https://api.spoonacular.com/recipes/findByIngredients"
        params = {
            'apiKey': SPOONACULAR_API_KEY,
            'ingredients': ingredientsStr,
            'number': numberOfRecipies,
            'limitLicense': True,
            'ranking': 2,
            'ignorePantry': False
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        recipesBasic = response.json()

        if not recipesBasic:
            print('No recipes found with all ingredients, trying individual ingredients...')
            allRecipes = []

            for ingredient in ingredients:
                individualParams = params.copy()
                individualParams['ingredients'] = ingredient
                individualParams['number'] = 3

                try:
                    individualResponse = requests.get(url, params=individualParams, timeout=10)
                    if individualResponse.status_code == 200:
                        individualRecipes = individualResponse.json()
                        allRecipes.extend(individualRecipes)
                except:
                    continue

            seenIds = set()
            recipesBasic = []
            for recipe in allRecipes:
                if recipe['id'] not in seenIds:
                    recipesBasic.append(recipe)
                    seenIds.add(recipe['id'])
            recipesBasic = recipesBasic[:numberOfRecipies]

        if not recipesBasic:
            return [], 'No recipes found even with individual ingredients'
        
        detailedRecipes = []
        for recipe in recipesBasic:
            recipeId = recipe['id']

            detailUrl = f'https://api.spoonacular.com/recipes/{recipeId}/information'
            detailParams = {
                'apiKey': SPOONACULAR_API_KEY,
                'includeNutrition': False
            }

            try:
                detailResponse = requests.get(detailUrl, params=detailParams, timeout=10)
                if detailResponse.status_code == 200:
                    detailedInfo = detailResponse.json()

                    summary = detailedInfo.get('summary', '')
                    import re
                    summary = re.sub('<.*?>', '', summary)

                    formattedRecipe = {
                        'id': recipeId,
                        'title': detailedInfo.get('title', 'Unknown Recipe'),
                        'image': detailedInfo.get('image', ''),
                        'readyInMinutes': detailedInfo.get('readyInMinutes', 'Unknown'),
                        'servings': detailedInfo.get('servings', 'Unknown'),
                        'sourceUrl': detailedInfo.get('sourceUrl', ''),
                        'summary': summary[:200] + '...' if len(summary) > 200 else summary,
                        'usedIngredients': [ing['name'] for ing in recipe.get('usedIngredients', [])],
                        'missedIngredients': [ing['name'] for ing in recipe.get('missedIngredients', [])],
                        'usedIngredientCount': recipe.get('usedIngredientCount', 0),
                        'missedIngredientCount': recipe.get('missedIngredientCount', 0),
                        'instructions': [],
                        'source': 'Spoonacular'
                    }

                    if 'analyzedInstructions' in detailedInfo and detailedInfo['analyzedInstructions']:
                        for instructionGroup in detailedInfo['analyzedInstructions']:
                            for step in instructionGroup.get('steps', []):
                                formattedRecipe['instructions'].append({
                                    'number': step.get('number', 0),
                                    'step': step.get('step', '')
                                })
                    detailedRecipes.append(formattedRecipe)
            except requests.RequestException:
                continue

        return detailedRecipes, None
    except requests.RequestException as e:
        return None, f'API request failed: {str(e)}'
    except Exception as e:
        return None, f'Error fetching recipes: {str(e)}'

@app.route('/api/ingredients', methods=['GET'])
def getIngredients():
    try:
        with get_db_connection() as con:
            ingredients = con.execute('''
                SELECT id, name, expiryDate, quantity, category, dateAdded
                FROM ingredients
                ORDER BY expiryDate ASC
                ''').fetchall()
        
        result = []
        for ingredient in ingredients:
            daysLeft = daysUntilExpiry(ingredient['expiryDate'])
            status = 'unknown'
            if daysLeft is not None:
                if daysLeft < 0:
                    status = 'expired'
                elif daysLeft <= 3:
                    status = 'expiringSoon'
                elif daysLeft <= 7:
                    status = 'expiringThisWeek'
                else:
                    status = 'fresh'
            
            result.append({
                'id': ingredient['id'],
                'name': ingredient['name'],
                'expiryDate': ingredient['expiryDate'],
                'quantity': ingredient['quantity'],
                'category': ingredient['category'],
                'dateAdded': ingredient['dateAdded'],
                'daysUntilExpiry': daysLeft,
                'status': status
            })

        return jsonify(result)
    except Exception as e:
        print(f"Error in getIngredients: {e}")
        return jsonify({'error': 'Failed to fetch ingredients'}), 500

@app.route('/api/ingredients', methods=['POST'])
def addIngredients():
    try:
        data = request.get_json()
        print(f'Received data: {data}')   #Remove later

        if not data or 'name' not in data or 'expiryDate' not in data:
            return jsonify({'error': 'Name and expiryDate are required'}), 400
        
        try:
            datetime.datetime.strptime(data['expiryDate'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        with get_db_connection() as con:
            cursor = con.execute('''
                INSERT INTO ingredients (name, expiryDate, quantity, category)
                VALUES (?, ?, ?, ?)
            ''', (
                    data['name'],
                    data['expiryDate'],
                    data.get('quantity', ''),
                    data.get('category', '')
            ))
            con.commit()
            ingredientId = cursor.lastrowid

        print(f'Successfully added ingredient with ID: {ingredientId}')   #Remove later
        return jsonify({'message': 'Ingredient added successfully', 'id': ingredientId}), 201
    except Exception as e:
        print(f'Error in addIngredients: {e}')   #Remove later
        return jsonify({'error': f'Failed to add ingredient: {str(e)}'}), 500

@app.route('/api/ingredients/<int:ingredientId>', methods=['PUT'])
def updateIngredient(ingredientId):
    try: 
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'expiryDate' in data:
            try:
                datetime.datetime.strptime(data['expiryDate'], '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
            
        updateFields = []
        values = []

        for field in ['name', 'expiryDate', 'quantity', 'category']:
            if field in data:
                updateFields.append(f"{field} = ?")
                values.append(data[field])
            
        if not updateFields:
            return jsonify({'error': 'No valid fields to update'}), 400

        values.append(ingredientId)
        query = f"UPDATE ingredients SET {', '.join(updateFields)} WHERE id = ?"

        with get_db_connection() as con:
            cursor = con.execute(query, values)
            con.commit()

            if cursor.rowcount == 0:
                return jsonify({'error': 'Ingredient not found'}), 404
            
        return jsonify({'message': 'Ingredient updated successfully'})
    except Exception as e:
        print(f'Error in updateIngredient: {e}')
        return jsonify({'error': f'Failed to update ingredient: {str(e)}'}), 500

@app.route('/api/ingredients/<int:ingredientId>', methods=['DELETE'])
def deleteIngredient(ingredientId):
    with get_db_connection() as con:
        cursor = con.execute('DELETE FROM ingredients WHERE id = ?', (ingredientId,))
        con.commit()

        if cursor.rowcount == 0:
            return jsonify({'error': 'Ingredient not found'}), 404
        
    return jsonify({'message': 'Ingredient deleted successfully'})

@app.route('/api/expiring', methods=['GET'])
def getExpiringIngredients():
    days = request.args.get('days', 7, type=int)

    with get_db_connection() as con:
        ingredients = con.execute('''
            SELECT id, name, expiryDate, quantity, category
            FROM ingredients
            WHERE DATE(expiryDate) BETWEEN DATE('now') AND DATE('now', '+7 days')
            ORDER BY expiryDate ASC
        '''.format(days)).fetchall()

    result = []
    for ingredient in ingredients:
        daysLeft = daysUntilExpiry(ingredient['expiryDate'])
        result.append({
            'id': ingredient['id'],
            'name': ingredient['name'],
            'expiryDate': ingredient['expiryDate'],
            'quantity': ingredient['quantity'],
            'category': ingredient['category'],
            'daysUntilExpiry': daysLeft
        })

    return jsonify(result)

@app.route('/api/recipe-suggestions', methods=['GET'])
def getRecipeSuggestions():
    try:
        days = request.args.get('days', 7, type=int)

        with get_db_connection() as con:
            expiringIngredients = con.execute('''
                SELECT name FROM ingredients
                WHERE DATE(expiryDate) BETWEEN DATE('now') AND DATE('now', '+{} days')
            '''.format(days)).fetchall()
        
        if not expiringIngredients:
            return jsonify({
                'message': 'No ingredients expiring soon',
                'recipes': [],
                'expiringIngredients': []
            })
        
        ingredientNames = [row['name'] for row in expiringIngredients]
        recipes, error = getRecipesFromSpoonacular(ingredientNames)

        if error:
            return jsonify({
                'error': error,
                'expiringIngredients': ingredientNames,
                'recipes': []
            }), 500
        
        if not recipes:
            return jsonify({
                'message': 'No recipes found with your expiring ingredients. Try adding more common ingredients to your pantry.',
                'expiringIngredients': ingredientNames,
                'recipes': []
            })
        
        recipes.sort(key=lambda x: x.get('usedIngredientCount', 0), reverse=True)
        
        return jsonify({
            'expiringIngredients': ingredientNames,
            'recipes': recipes,
            'recipeCount': len(recipes),
            'message': f'Found {len(recipes)} recipes using your expiring ingredients!'
        })
    except Exception as e:
        return jsonify({'error': f'Failed to get recipe suggestions: {str(e)}'}), 500

@app.route('/api/stats', methods=['GET'])
def getStats():
    with get_db_connection() as con:
        total = con.execute('SELECT COUNT(*) as count FROM ingredients').fetchone()['count']
        expired = con.execute('''
            SELECT COUNT(*) as count FROM ingredients
            WHERE DATE(expiryDate) < DATE('now')
        ''').fetchone()['count']
        expiringSoon = con.execute('''
            SELECT COUNT(*) as count FROM ingredients 
            WHERE DATE(expiryDate) BETWEEN DATE('now') AND DATE('now', '+3 days')
        ''').fetchone()['count']

    return jsonify({
        'totalIngredients': total,
        'expired': expired,
        'expiringSoon': expiringSoon,
        'fresh': total - expired - expiringSoon
    })

@app.route('/api/test-data', methods=['POST'])
def addTestData():
    testIngredients = [
        {'name': 'Milk', 'expiryDate': '2025-08-15', 'quantity': '1 gallon', 'category': 'Dairy'},
        {'name': 'Bread', 'expiryDate': '2025-08-16', 'quantity': '1 loaf', 'category': 'Bakery'},
        {'name': 'Apples', 'expiryDate': '2025-08-20', 'quantity': '6 pieces', 'category': 'Fruit'},
        {'name': 'Chicken', 'expiryDate': '2025-08-14', 'quantity': '2 lbs', 'category': 'Meat'},
        {'name': 'Yogurt', 'expiryDate': '2025-08-25', 'quantity': '4 cups', 'category': 'Dairy'}
    ]

    with get_db_connection() as con:
        for ingredient in testIngredients:
            con.execute('''
                INSERT INTO ingredients (name, expiryDate, quantity, category)
                VALUES (?, ?, ?, ?)
            ''', (ingredient['name'], ingredient['expiryDate'], 
                  ingredient['quantity'], ingredient['category']))
        con.commit()
    
    return jsonify({'message': f'Added {len(testIngredients)} test ingredients'})

@app.route('/api/ingredients/reset-database', methods=['DELETE'])
def resetDatabase():
    confirm = request.args.get('confirm', '').lower()
    
    if confirm != 'true':
        return jsonify({
            'error': 'This action requires confirmation. Add ?confirm=true to the URL'}), 400
    
    with get_db_connection() as con:
        cursor = con.execute('DELETE FROM ingredients')
        deletedCount = cursor.rowcount
        
        con.execute('DELETE FROM sqlite_sequence WHERE name="ingredients"')
        con.commit()
    
    return jsonify({
        'message': f'Database reset successfully. Deleted {deletedCount} ingredients',
        'deletedCount': deletedCount
    })

if __name__ == '__main__':
    init_database()
    app.run(debug=True)
