import random
from nltk.corpus import wordnet as wn

# load once at startup instead of on every request
NOUN_LEMMAS = list(set(
    lemma.name().replace('_', ' ')
    for synset in wn.all_synsets(pos=wn.NOUN)
    for lemma in synset.lemmas()
))

def get_random_noun():
    return random.choice(NOUN_LEMMAS)

def best_shared_hierarchy(word1, word2):
    best = []
    best_pair = (None, None)

    synsets1 = wn.synsets(word1, pos=wn.NOUN)
    synsets2 = wn.synsets(word2, pos=wn.NOUN)

    for syn1 in synsets1:
        for syn2 in synsets2:
            hyper1 = set(syn1.closure(lambda s: s.hypernyms()))
            hyper2 = set(syn2.closure(lambda s: s.hypernyms()))

            shared = hyper1.intersection(hyper2)
            sorted_shared = sorted(shared, key=lambda s: s.max_depth())

            if len(sorted_shared) > len(best):
                best = sorted_shared
                best_pair = (syn1, syn2)

    return best, best_pair

def is_valid_puzzle(word1, word2, min_ancestors=5):
    shared, pair = best_shared_hierarchy(word1, word2)
    return len(shared) >= min_ancestors, shared, pair

def generate_puzzle(min_ancestors=5, max_attempts=100):
    for _ in range(max_attempts):
        word1 = get_random_noun()
        word2 = get_random_noun()

        valid, shared, pair = is_valid_puzzle(word1, word2, min_ancestors)

        if valid:
            syn1, syn2 = pair
            hint = {
                word1: {"synset": syn1.name(), "definition": syn1.definition()},
                word2: {"synset": syn2.name(), "definition": syn2.definition()}
            }
            return word1, word2, shared, hint

    return None

def points_for(depth, max_depth):
    return round(((depth + 1) / (max_depth + 1)) * 100)

def reveal_hint(hint):
    print("Hint — intended meanings:\n")
    for word, info in hint.items():
        print(f"{word} → {info['synset']} | {info['definition']}")