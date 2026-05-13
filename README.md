# Wordnet-Connections
Play at `https://reysaden.github.io/Wordnet-Connections/`

A word game built on top of WordNet's hypernym tree. Two words are shown — your goal is to find as many of their common hypernyms as possible before running out of guesses. The deeper the hypernym, the more points it's worth.

## How It Works

WordNet is a lexical database that organizes English nouns into a hierarchy of meaning. Every noun traces back up to `entity` at the root through a chain of hypernyms — more general concepts that contain it.

For example:

wolf → canine → carnivore → mammal → animal → organism → ...→ entity

Two words that seem unrelated can share a surprisingly deep common ancestor depending on which sense of the word is used. The word *gun* under its default sense is an artifact — but under its *gunman* sense, it's a person. This ambiguity is the core mechanic of the game.

## Gameplay

- You are shown two words
- You have `n + 2` guesses where `n` is the number of common hypernyms
- Type a hypernym and hit enter to guess
- Correct guesses light up on the depth chart and add points to your score
- After your first guess, the intended noun sense of each word is revealed as a hint
- The game ends when you find all hypernyms or run out of guesses

## Scoring

Points are awarded based on how deep the hypernym sits in WordNet's hierarchy:
points = ((depth + 1) / (max_depth + 1)) * 100

Shallow ancestors like `entity` score very little. Deep ancestors like `carnivore` or `person` score close to 100 pts. Your final score is the sum of all correct guesses.

## Project Structure
wordnet-connections/
├── backend/
│   ├── app.py           ← Flask API
│   ├── game.py          ← WordNet logic
│   ├── requirements.txt
│   └── render.yaml      ← Render deployment config
└── docs/
├── index.html
├── style.css
└── script.js

## Running Locally

**Backend**

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The API will be available at `http://localhost:5000`. Update the `API` variable in `docs/script.js` to point to `http://localhost:5000` when running locally.

**Frontend**

Open `docs/index.html` directly in your browser or serve it with:

```bash
cd docs
npx serve .
```

## Deployment

- **Backend** — hosted on [Render](https://render.com) 
- **Frontend** — hosted on GitHub Pages from the `/docs` folder at `https://reysaden.github.io/Wordnet-Connections/`

## Built With

- [NLTK WordNet](https://www.nltk.org/howto/wordnet.html)
- [Flask](https://flask.palletsprojects.com/)
- Vanilla HTML, CSS, JavaScript
