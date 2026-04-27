from flask import Flask, request, jsonify, session
from flask_cors import CORS
from game import generate_puzzle, points_for, reveal_hint
import nltk
import secrets
import os

# ---- NLTK SETUP ----
nltk_data_path = '/opt/render/project/src/nltk_data'
os.makedirs(nltk_data_path, exist_ok=True)
nltk.data.path.append(nltk_data_path)

# Download required datasets
nltk.download('wordnet', download_dir=nltk_data_path)
nltk.download('omw-1.4', download_dir=nltk_data_path)

# ---- APP SETUP ----
app = Flask(__name__)
app.secret_key = secrets.token_hex(16)

# Enable CORS with credentials (important for sessions)
CORS(app, supports_credentials=True)

# Fix cookies for cross-site (Render frontend/backend)
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True

# ---- ROUTES ----

@app.route('/new-game', methods=['GET'])
def new_game():
    puzzle = generate_puzzle()

    if not puzzle:
        return jsonify({"error": "Couldn't generate a valid puzzle. Try again."}), 500

    word1, word2, shared, hint = puzzle

    ancestor_names = [s.name().split('.')[0].replace('_', ' ') for s in shared]
    max_depth = shared[-1].max_depth()

    ancestor_depths = {
    s.name().split('.')[0].replace('_', ' ').lower(): s.max_depth()
    for s in shared
    }

    ancestor_slots = [
        {
            "name": s.name().split('.')[0].replace('_', ' '),
            "depth": s.max_depth(),
            "pts": points_for(s.max_depth(), max_depth)
        }
        for s in shared
    ]

    session['ancestor_names'] = ancestor_names
    session['ancestor_depths'] = ancestor_depths
    session['max_depth'] = max_depth
    session['hint'] = hint
    session['found'] = []
    session['guesses_left'] = len(ancestor_names) + 2
    session['score'] = 0
    session['hint_revealed'] = False

    return jsonify({
        "word1": word1,
        "word2": word2,
        "total_ancestors": len(ancestor_names),
        "guesses_left": session['guesses_left'],
        "ancestor_slots": ancestor_slots
    })


@app.route('/guess', methods=['POST'])
def guess():
    data = request.get_json()
    guess = data.get('guess', '').strip().lower().replace('_', ' ')

    ancestor_names = [a.lower() for a in session.get('ancestor_names', [])]
    ancestor_depths = session.get('ancestor_depths', {})
    found = session.get('found', [])
    guesses_left = session.get('guesses_left', 0)
    score = session.get('score', 0)
    max_depth = session.get('max_depth', 1)
    hint_revealed = session.get('hint_revealed', False)
    hint = session.get('hint', {})

    response = {}

    # ---- CORRECT GUESS ----
    if guess in ancestor_names and guess not in found:
        depth = ancestor_depths.get(guess, 0)
        pts = points_for(depth, max_depth)

        score += pts
        found.append(guess)

        session['found'] = found
        session['score'] = score

        response['result'] = 'correct'
        response['pts'] = pts
        response['depth'] = depth
        response['score'] = score
        response['found'] = found

        if len(found) == len(ancestor_names):
            response['game_over'] = True
            response['message'] = 'You found them all!'
            response['ancestor_chain'] = ancestor_names

    # ---- ALREADY FOUND ----
    elif guess in found:
        response['result'] = 'already_found'

    # ---- INCORRECT ----
    else:
        # Clamp to 0 (prevents negative)
        guesses_left = max(0, guesses_left - 1)
        session['guesses_left'] = guesses_left

        response['result'] = 'incorrect'
        response['guesses_left'] = guesses_left

        if guesses_left <= 0:
            response['game_over'] = True
            response['message'] = 'Out of guesses!'
            response['score'] = score
            response['ancestor_chain'] = ancestor_names

    # ---- HINT ----
    if not hint_revealed:
        session['hint_revealed'] = True
        response['hint'] = hint

    # Always send authoritative value
    response['guesses_left'] = session.get('guesses_left', 0)

    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)