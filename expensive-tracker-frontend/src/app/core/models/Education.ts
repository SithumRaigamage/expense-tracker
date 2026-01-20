export interface EducationalContent {
  id: string;
  title: string;
  type: 'article' | 'video' | 'tutorial' | 'quiz';
  description: string;
  thumbnail: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  link: string;
  completed?: boolean;
}

export interface FinancialTerm {
  term: string;
  definition: string;
  category: string;
}
