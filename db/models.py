import numpy as np
import json
from sqlalchemy import Column, Text, Integer, BLOB, TypeDecorator, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Base class for all models
Base = declarative_base()

# Custom type for vector embeddings
class Vector32(TypeDecorator):
    """SQLAlchemy type for 32-bit float vector embeddings"""
    impl = BLOB
    cache_ok = True
    
    def __init__(self, dimensions=None, *args, **kwargs):
        self.dimensions = dimensions
        super().__init__(*args, **kwargs)
    
    def process_bind_param(self, value, dialect):
        """Convert from Python to database format"""
        if value is None:
            return None
            
        # Already bytes - pass through
        if isinstance(value, bytes):
            return value
            
        # String that might be JSON
        if isinstance(value, str):
            try:
                if value.startswith('[') and value.endswith(']'):
                    # Convert JSON array to numpy array
                    arr = np.array(json.loads(value), dtype=np.float32)
                    return arr.tobytes()
            except:
                # If conversion fails, return as is - SQLite will handle
                return value
                
        # Convert list to numpy array
        if isinstance(value, list):
            return np.array(value, dtype=np.float32).tobytes()
            
        # Convert numpy array to bytes
        if isinstance(value, np.ndarray):
            return value.astype(np.float32).tobytes()
            
        # Unknown type - pass through and let SQLAlchemy handle
        return value
    
    def process_result_value(self, value, dialect):
        """Convert from database format to Python"""
        if value is None:
            return None
            
        # Handle string values (SQLite might return strings for BLOB)
        if isinstance(value, str):
            try:
                # Try to parse as JSON if it's a string containing an array
                if value.startswith('[') and value.endswith(']'):
                    return np.array(json.loads(value), dtype=np.float32)
                else:
                    # If it's not JSON, log but don't raise exception
                    print(f"Warning: Embedding value is string but not JSON array: {value[:30]}...")
                    return np.array([], dtype=np.float32)
            except Exception as e:
                print(f"Error parsing embedding string value: {str(e)}")
                return np.array([], dtype=np.float32)
                
        # Handle bytes (normal case)
        try:
            array = np.frombuffer(value, dtype=np.float32)
            
            # If dimensions are specified, reshape
            if self.dimensions is not None and array.size > 0:
                # Check if dimensions match
                if array.size % self.dimensions == 0:
                    rows = array.size // self.dimensions
                    # If only one row, return flat array for compatibility
                    if rows == 1:
                        # For single row, can either return flat or shaped:
                        # Flat: return array
                        # Shaped: return array.reshape(1, self.dimensions)
                        return array.reshape(1, self.dimensions)  # Keep shape for consistency
                    # Otherwise return proper shape
                    return array.reshape(rows, self.dimensions)
                else:
                    print(f"Warning: Array size {array.size} is not divisible by dimensions {self.dimensions}")
            
            # Return flat array if no dimensions or dimensions don't match
            return array
        except TypeError as e:
            print(f"Error processing embedding bytes: {str(e)}, type: {type(value)}")
            return np.array([], dtype=np.float32)
        except Exception as e:
            print(f"Unexpected error processing embedding: {str(e)}")
            return np.array([], dtype=np.float32)


# Define models based on schema.ts
class Doc(Base):
    """Model for docs table, matching drizzle schema"""
    __tablename__ = 'docs'
    
    id = Column(Text, primary_key=True, nullable=False)
    source = Column(Text, nullable=False)  # enum in TS but Text in SQLite
    content = Column(Text, nullable=False)
    createdAt = Column(Integer, nullable=False)
    creatorId = Column(Text, nullable=False)
    embedding = Column(Vector32())
    
    def __repr__(self):
        return f"<Doc(id={self.id}, source={self.source})>"


def get_session(db_url):
    """Create a database session"""
    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    return Session() 