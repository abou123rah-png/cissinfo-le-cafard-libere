
export interface NewsHeadline {
  title: string;
  category: string;
  source: string;
  content: string;
  confidence: number;
  imageUrl?: string;
}

export interface Opportunity {
  type: string;
  title: string;
  deadline: string;
}

export interface Innovation {
  title: string;
  description: string;
  imageUrl?: string;
}

export interface DebateDetails {
  pro: string;
  con: string;
  proExpert: string;
  conExpert: string;
}

export interface DailyReview {
  date: string;
  debateQuestion: string;
  summary: string;
  headlines: NewsHeadline[];
  opportunities: Opportunity[];
  innovation: Innovation;
  debateDetails: DebateDetails;
  motEnseignant: string;
  sources: string[];
  caricatureCaption: string;
}

export interface AppState {
  review: DailyReview | null;
  caricatureUrl: string | null;
  isLoading: boolean;
  isAudioPlaying: boolean;
  error: string | null;
}
