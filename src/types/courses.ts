export interface Course {
  id: string;
  title: string;
  instructor: string;
  category: string;
  level: "Principiante" | "Intermedio" | "Avanzado";
  description: string;
  priceMXNB: number;
  duration: string;
  coverImage: string;
  rating: number;
  reviews: number;
  tags: string[];
  featured?: boolean;
  trending?: boolean;
}


