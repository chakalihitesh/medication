import os
import re

# Directories to index
KNOWLEDGE_DIRS = ["health_data", "medicine_info", "disease_guidelines"]

# Stop words to filter out during scoring
STOP_WORDS = {
    "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "to", "for", 
    "of", "in", "on", "at", "by", "with", "about", "against", "into", "through", 
    "during", "before", "after", "above", "below", "from", "up", "down", "in", 
    "out", "over", "under", "again", "further", "then", "once", "here", "there", 
    "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", 
    "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", 
    "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"
}

class KnowledgeBase:
    def __init__(self):
        self.chunks = []
        self.load_repository()

    def clean_text(self, text):
        """Standardizes text for matching by converting to lower case and removing symbols."""
        return re.sub(r'[^\w\s]', '', text.lower()).strip()

    def get_words(self, text):
        """Splits text into words and filters out stop words."""
        cleaned = self.clean_text(text)
        return [word for word in cleaned.split() if word not in STOP_WORDS]

    def load_repository(self):
        """Scans the local directories and splits text files into semantic section chunks."""
        self.chunks = []
        print("[RAG] Loading reference documents from local repository...")

        for directory in KNOWLEDGE_DIRS:
            if not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)
                continue

            for filename in os.listdir(directory):
                if filename.endswith(".md") or filename.endswith(".txt"):
                    file_path = os.path.join(directory, filename)
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read()

                        # Split document by markdown headings (e.g. "## Section Title")
                        # This creates meaningful chunks containing related guidelines or facts
                        sections = re.split(r'\n(?=##\s)', content)
                        
                        # The first section might be the top-level # Title, let's capture it
                        doc_title = "General Reference"
                        title_match = re.search(r'^#\s+(.+)', sections[0])
                        if title_match:
                            doc_title = title_match.group(1).strip()

                        for sec in sections:
                            # Extract section heading
                            heading_match = re.search(r'^##\s+(.+)', sec.strip(), re.MULTILINE)
                            sec_heading = heading_match.group(1).strip() if heading_match else doc_title
                            
                            # Clean content
                            sec_content = sec.strip()
                            if sec_content:
                                self.chunks.append({
                                    "title": doc_title,
                                    "heading": sec_heading,
                                    "content": sec_content,
                                    "source": file_path
                                })
                    except Exception as e:
                        print(f"[RAG WARNING] Failed to read {file_path}: {e}")

        print(f"[RAG] Indexed {len(self.chunks)} knowledge chunks.")

    def search(self, query, top_k=2):
        """
        Searches the chunks for terms matching the query.
        Returns the top_k most relevant chunks using word matches weighted by section importance.
        """
        query_words = self.get_words(query)
        if not query_words:
            return []

        scored_chunks = []

        for chunk in self.chunks:
            score = 0
            
            # Words in the document title or section heading get higher weight
            heading_words = self.get_words(chunk["heading"])
            title_words = self.get_words(chunk["title"])
            content_words = self.get_words(chunk["content"])

            for qw in query_words:
                # Term Frequency weightings
                score += title_words.count(qw) * 3.0    # Highest weight for title match
                score += heading_words.count(qw) * 2.0  # Medium weight for section title match
                score += content_words.count(qw) * 1.0  # standard weight for body match

            if score > 0:
                scored_chunks.append((score, chunk))

        # Sort chunks based on query scores in descending order
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        
        results = [chunk for score, chunk in scored_chunks[:top_k]]
        return results

    def get_rag_context(self, query):
        """Retrieves matching context chunks and formats them as a clean prompt injection string."""
        matches = self.search(query, top_k=2)
        if not matches:
            return "No local repository files matched this query. Use general knowledge."

        context_str = "Use the following verified local medical reference information to answer the user's question:\n\n"
        for i, match in enumerate(matches, 1):
            context_str += f"--- [Reference Document {i}: {match['title']} - {match['heading']}] ---\n"
            context_str += f"{match['content']}\n\n"
        return context_str

# Singleton instance to load once across modules
kb_instance = KnowledgeBase()

if __name__ == "__main__":
    # Test execution
    kb = KnowledgeBase()
    test_query = "What diet should a diabetes patient eat?"
    print(f"\nTesting search query: '{test_query}'")
    context = kb.get_rag_context(test_query)
    print(context)
