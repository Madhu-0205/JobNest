import json
import time
import os
from deep_translator import GoogleTranslator

locales_dir = os.path.join(os.path.dirname(__file__), '../locales')
en_dict = json.load(open(os.path.join(locales_dir, 'en.json')))

def translate_dict(target_lang):
    print(f"Translating for {target_lang}...")
    dict_path = os.path.join(locales_dir, f'{target_lang}.json')
    try:
        existing_dict = json.load(open(dict_path))
    except:
        existing_dict = {}

    translator = GoogleTranslator(source='en', target=target_lang)
    
    keys_to_translate = []
    for k, v in en_dict.items():
        if not existing_dict.get(k) or existing_dict[k] == v or existing_dict[k].startswith('['):
            keys_to_translate.append((k, v))
            
    print(f"Found {len(keys_to_translate)} keys to translate for {target_lang}")
    
    # We will chunk them into blocks of 2000 chars
    chunks = []
    curr_chunk_keys = []
    curr_chunk_vals = []
    curr_len = 0
    DELIMITER = " ||| "
    
    for k, v in keys_to_translate:
        if curr_len + len(v) + len(DELIMITER) > 2000 or len(curr_chunk_keys) >= 40:
            chunks.append((curr_chunk_keys, curr_chunk_vals))
            curr_chunk_keys = []
            curr_chunk_vals = []
            curr_len = 0
            
        curr_chunk_keys.append(k)
        curr_chunk_vals.append(v)
        curr_len += len(v) + len(DELIMITER)
        
    if curr_chunk_keys:
        chunks.append((curr_chunk_keys, curr_chunk_vals))
        
    for keys, vals in chunks:
        text_to_translate = DELIMITER.join(vals)
        try:
            res = translator.translate(text_to_translate)
            translated_vals = [s.strip() for s in res.split(DELIMITER.strip())]
            for i, k in enumerate(keys):
                existing_dict[k] = translated_vals[i] if i < len(translated_vals) else vals[i]
        except Exception as e:
            print(f"Error translating chunk: {e}")
            for i, k in enumerate(keys):
                # Fallback translation if Google fails completely
                existing_dict[k] = f"{target_lang.upper()}: {vals[i]}"
        
        with open(dict_path, 'w', encoding='utf-8') as f:
            json.dump(existing_dict, f, ensure_ascii=False, indent=2)
        
        time.sleep(1) # wait 1 second between chunks
        
    print(f"Finished {target_lang}")

translate_dict('hi')
translate_dict('ta')
