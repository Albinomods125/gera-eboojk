
export interface PDFSection {
    heading: string;
    content: string;
    imageUrl?: string;
}

export interface GeneratedContent {
    title: string;
    sections: PDFSection[];
}

export type Status = 'idle' | 'loading' | 'success' | 'error';

export interface AppState {
    status: Status;
    prompt: string;
    generatedContent: GeneratedContent | null;
    error: string | null;
    progress: string;
}
