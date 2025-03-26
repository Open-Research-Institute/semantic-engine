#!/usr/bin/env -S uv run --script --quiet
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "sqlalchemy>=2.0.0",
#     "numpy>=1.24.0",
#     "nomic>=3.4.1",
# ]
# ///

import os
import sys
import numpy as np
from nomic import atlas
# Import the SQLAlchemy models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.models import Doc, get_session

dataset_name = (sys.argv[1])


# Connect to the database using SQLAlchemy
db_url = os.getenv("DB_URL")
if not db_url:
    print("Error: DB_URL environment variable not set")
    sys.exit(1)

if db_url.startswith("file:"):
    db_url = f"sqlite:///{db_url[5:]}"
try:
    session = get_session(db_url)    
    # Query all documents with embeddings
    print("Querying documents with embeddings...")
    # Optimize query to only fetch documents that have embeddings
    docs = session.query(Doc).filter(Doc.embedding != None).all()
    
    embeddings = []
    data = []
    valid_count = 0
    
    print(f"Processing {len(docs)} documents...")
    
    for doc in docs:
        if hasattr(doc, 'embedding') and doc.embedding is not None and len(doc.embedding) > 0:
            # Vector32 type already handles the correct shape conversion
            embeddings.append(doc.embedding)
            
            # Add metadata
            data.append({
                "id": doc.id,
                "source": doc.source,
                "content": doc.content,
                "createdAt": doc.createdAt,
                "creatorId": doc.creatorId
            })
            
            valid_count += 1
            if valid_count % 100 == 0:
                print(f"Processed {valid_count} valid documents")
    
    if embeddings:
        print(f"Found {len(embeddings)} documents with valid embeddings")
        
        # Convert list of embeddings to numpy array
        embeddings_array = np.array(embeddings)
        print(f"Embeddings array shape: {embeddings_array.shape}")
        
        # Push to Nomic Atlas
        print("Pushing data to Nomic Atlas...")
        # Hint: comment out embeddings and uncomment indexed_field to let Nomic use its own embeddings model
        atlas.map_data(
            embeddings=embeddings_array,
            id_field='id',
            data=data,
            # indexed_field='content',
            identifier=dataset_name,
            topic_model={"build_topic_model": True, "topic_label_field": 'content'}
        )
        print("Successfully pushed data to Nomic Atlas!")
    else:
        print("No valid documents with embeddings found")
        
except Exception as e:
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
