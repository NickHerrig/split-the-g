export type Score = {
  id: string;
  created_at: string;
  split_score: number;
  split_image_url: string;
  pint_image_url: string;
  username: string;
  email?: string;
  email_opted_out?: boolean;
  city?: string;
  region?: string;
  country?: string;
  country_code?: string;
  bar_name?: string;
  bar_address?: string;
  pour_rating?: number;
  session_id?: string;
};
