-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.recordings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title character varying NOT NULL,
  file_path text NOT NULL,
  size_bytes bigint NOT NULL,
  duration integer,
  transcript_status character varying DEFAULT 'pending'::character varying CHECK (transcript_status::text = ANY (ARRAY['pending'::character varying, 'processing'::character varying, 'done'::character varying, 'error'::character varying]::text[])),
  subject_id uuid,
  user_id bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  markers jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT recordings_pkey PRIMARY KEY (id),
  CONSTRAINT recordings_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT recordings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.subjects (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  icon character varying DEFAULT 'book-outline'::character varying,
  user_id bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subjects_pkey PRIMARY KEY (id),
  CONSTRAINT subjects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.transcriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  recording_id uuid NOT NULL UNIQUE,
  user_id bigint NOT NULL,
  content text NOT NULL,
  edited boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transcriptions_pkey PRIMARY KEY (id),
  CONSTRAINT transcriptions_recording_id_fkey FOREIGN KEY (recording_id) REFERENCES public.recordings(id),
  CONSTRAINT transcriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  userName character varying NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE,
  password text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);