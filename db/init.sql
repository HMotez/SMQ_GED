SET session_replication_role = replica;
--
-- PostgreSQL database dump
--

\restrict 1vdjphNRslmf0KKbWZLlGCN8U2TabA3UU9dmeuuuHP0NZni34XWAseFs0sFCRrO

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_query_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_query_logs (
    id integer NOT NULL,
    user_id integer,
    query_text text NOT NULL,
    intent character varying(80),
    result_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ai_query_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_query_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_query_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_query_logs_id_seq OWNED BY public.ai_query_logs.id;


--
-- Name: doc_code_sequences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doc_code_sequences (
    type_code character varying(10) NOT NULL,
    process_code character varying(50) DEFAULT 'GLOBAL'::character varying NOT NULL,
    last_number integer DEFAULT 0 NOT NULL
);


--
-- Name: document_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_types (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    label character varying(100) NOT NULL
);


--
-- Name: document_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.document_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: document_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.document_types_id_seq OWNED BY public.document_types.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    doc_code character varying(50),
    title character varying(255) NOT NULL,
    responsible character varying(255),
    next_review_date date,
    status_id integer NOT NULL,
    current_version character varying(10) DEFAULT '-'::character varying,
    folder_id integer,
    type_id integer,
    process_id integer,
    created_by integer,
    origin character varying(10) DEFAULT 'INTERNE'::character varying,
    context text,
    project_ref character varying(100),
    keywords text[],
    file_path character varying(500),
    file_name character varying(255),
    file_size bigint,
    mime_type character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    reviewer_emails text[] DEFAULT '{}'::text[],
    validator_emails text[] DEFAULT '{}'::text[],
    sharepoint_link text,
    validated_version character varying(10)
);


--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.folders (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50),
    level integer DEFAULT 1 NOT NULL,
    parent_id integer
);


--
-- Name: folders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.folders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: folders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.folders_id_seq OWNED BY public.folders.id;


--
-- Name: logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.logs (
    id integer NOT NULL,
    document_id integer,
    action character varying(100) NOT NULL,
    user_id integer,
    details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    ip_address character varying(64),
    user_agent text,
    severity character varying(16) DEFAULT 'info'::character varying NOT NULL,
    CONSTRAINT logs_severity_check CHECK (((severity)::text = ANY ((ARRAY['info'::character varying, 'warning'::character varying, 'critical'::character varying])::text[])))
);


--
-- Name: logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.logs_id_seq OWNED BY public.logs.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    document_id integer,
    message text NOT NULL,
    type character varying(50) DEFAULT 'validation'::character varying NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: processes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.processes (
    id integer NOT NULL,
    code character varying(50),
    strategic_process character varying(100),
    main_process character varying(100),
    sub_process character varying(100)
);


--
-- Name: processes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.processes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: processes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.processes_id_seq OWNED BY public.processes.id;


--
-- Name: reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reset_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(128) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reset_tokens_id_seq OWNED BY public.reset_tokens.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(255)
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: security_incidents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_incidents (
    id integer NOT NULL,
    type character varying(50) NOT NULL,
    severity character varying(16) DEFAULT 'warning'::character varying NOT NULL,
    description text NOT NULL,
    ip_address character varying(64),
    user_id integer,
    detected_at timestamp with time zone DEFAULT now(),
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    resolved_at timestamp with time zone,
    resolved_by integer,
    notes text,
    CONSTRAINT security_incidents_severity_check CHECK (((severity)::text = ANY ((ARRAY['info'::character varying, 'warning'::character varying, 'critical'::character varying])::text[]))),
    CONSTRAINT security_incidents_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'in_progress'::character varying, 'resolved'::character varying])::text[])))
);


--
-- Name: security_incidents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.security_incidents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: security_incidents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.security_incidents_id_seq OWNED BY public.security_incidents.id;


--
-- Name: status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


--
-- Name: status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.status_id_seq OWNED BY public.status.id;


--
-- Name: token_blacklist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_blacklist (
    jti character varying(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    role_id integer,
    is_active boolean DEFAULT false,
    last_login timestamp with time zone,
    requested_role character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    last_login_ip character varying(64),
    login_attempts integer DEFAULT 0,
    locked_until timestamp with time zone
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: validations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.validations (
    id integer NOT NULL,
    document_id integer NOT NULL,
    validator_id integer NOT NULL,
    validator_name character varying(255),
    validated_at timestamp with time zone DEFAULT now(),
    comment text,
    decision character varying(20) DEFAULT 'EN_ATTENTE'::character varying NOT NULL,
    version_letter character varying(5),
    signature_hash character varying(512),
    is_locked boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT validations_decision_check CHECK (((decision)::text = ANY ((ARRAY['APPROUVÉ'::character varying, 'REJETÉ'::character varying, 'EN_ATTENTE'::character varying])::text[])))
);


--
-- Name: validations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.validations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: validations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.validations_id_seq OWNED BY public.validations.id;


--
-- Name: versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.versions (
    id integer NOT NULL,
    document_id integer NOT NULL,
    version_letter character varying(10) NOT NULL,
    file_path character varying(500),
    file_name character varying(255),
    file_size bigint,
    mime_type character varying(100),
    change_summary text,
    created_at timestamp with time zone DEFAULT now(),
    created_by integer,
    sharepoint_link text
);


--
-- Name: versions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.versions_id_seq OWNED BY public.versions.id;


--
-- Name: ai_query_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_query_logs ALTER COLUMN id SET DEFAULT nextval('public.ai_query_logs_id_seq'::regclass);


--
-- Name: document_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_types ALTER COLUMN id SET DEFAULT nextval('public.document_types_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: folders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folders ALTER COLUMN id SET DEFAULT nextval('public.folders_id_seq'::regclass);


--
-- Name: logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs ALTER COLUMN id SET DEFAULT nextval('public.logs_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: processes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processes ALTER COLUMN id SET DEFAULT nextval('public.processes_id_seq'::regclass);


--
-- Name: reset_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.reset_tokens_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: security_incidents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_incidents ALTER COLUMN id SET DEFAULT nextval('public.security_incidents_id_seq'::regclass);


--
-- Name: status id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status ALTER COLUMN id SET DEFAULT nextval('public.status_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: validations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validations ALTER COLUMN id SET DEFAULT nextval('public.validations_id_seq'::regclass);


--
-- Name: versions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.versions ALTER COLUMN id SET DEFAULT nextval('public.versions_id_seq'::regclass);


--
-- Name: ai_query_logs ai_query_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_query_logs
    ADD CONSTRAINT ai_query_logs_pkey PRIMARY KEY (id);


--
-- Name: doc_code_sequences doc_code_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doc_code_sequences
    ADD CONSTRAINT doc_code_sequences_pkey PRIMARY KEY (type_code, process_code);


--
-- Name: document_types document_types_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_types
    ADD CONSTRAINT document_types_code_key UNIQUE (code);


--
-- Name: document_types document_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_types
    ADD CONSTRAINT document_types_pkey PRIMARY KEY (id);


--
-- Name: documents documents_doc_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_doc_code_key UNIQUE (doc_code);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);


--
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: processes processes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processes
    ADD CONSTRAINT processes_pkey PRIMARY KEY (id);


--
-- Name: reset_tokens reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reset_tokens
    ADD CONSTRAINT reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: reset_tokens reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reset_tokens
    ADD CONSTRAINT reset_tokens_token_key UNIQUE (token);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: security_incidents security_incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_incidents
    ADD CONSTRAINT security_incidents_pkey PRIMARY KEY (id);


--
-- Name: status status_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status
    ADD CONSTRAINT status_name_key UNIQUE (name);


--
-- Name: status status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status
    ADD CONSTRAINT status_pkey PRIMARY KEY (id);


--
-- Name: token_blacklist token_blacklist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_blacklist
    ADD CONSTRAINT token_blacklist_pkey PRIMARY KEY (jti);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: validations validations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validations
    ADD CONSTRAINT validations_pkey PRIMARY KEY (id);


--
-- Name: versions versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.versions
    ADD CONSTRAINT versions_pkey PRIMARY KEY (id);


--
-- Name: idx_ai_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_logs_created ON public.ai_query_logs USING btree (created_at DESC);


--
-- Name: idx_ai_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_logs_user ON public.ai_query_logs USING btree (user_id);


--
-- Name: idx_incidents_detected_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_detected_at ON public.security_incidents USING btree (detected_at DESC);


--
-- Name: idx_incidents_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_severity ON public.security_incidents USING btree (severity);


--
-- Name: idx_incidents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_status ON public.security_incidents USING btree (status);


--
-- Name: idx_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_action ON public.logs USING btree (action);


--
-- Name: idx_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_created_at ON public.logs USING btree (created_at DESC);


--
-- Name: idx_logs_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_document_id ON public.logs USING btree (document_id);


--
-- Name: idx_logs_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_severity ON public.logs USING btree (severity);


--
-- Name: idx_notif_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notif_unread ON public.notifications USING btree (user_id, is_read);


--
-- Name: idx_notif_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notif_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_reset_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reset_tokens_token ON public.reset_tokens USING btree (token);


--
-- Name: idx_token_blacklist_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_blacklist_expires ON public.token_blacklist USING btree (expires_at);


--
-- Name: idx_validations_decision; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_validations_decision ON public.validations USING btree (decision);


--
-- Name: idx_validations_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_validations_document_id ON public.validations USING btree (document_id);


--
-- Name: idx_validations_validator_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_validations_validator_id ON public.validations USING btree (validator_id);


--
-- Name: ai_query_logs ai_query_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_query_logs
    ADD CONSTRAINT ai_query_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: documents documents_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: documents documents_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE SET NULL;


--
-- Name: documents documents_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.status(id);


--
-- Name: documents documents_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.document_types(id);


--
-- Name: folders folders_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.folders(id) ON DELETE CASCADE;


--
-- Name: logs logs_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE SET NULL;


--
-- Name: logs logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reset_tokens reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reset_tokens
    ADD CONSTRAINT reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: security_incidents security_incidents_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_incidents
    ADD CONSTRAINT security_incidents_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: security_incidents security_incidents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_incidents
    ADD CONSTRAINT security_incidents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- Name: validations validations_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validations
    ADD CONSTRAINT validations_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: validations validations_validator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validations
    ADD CONSTRAINT validations_validator_id_fkey FOREIGN KEY (validator_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: versions versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.versions
    ADD CONSTRAINT versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: versions versions_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.versions
    ADD CONSTRAINT versions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 1vdjphNRslmf0KKbWZLlGCN8U2TabA3UU9dmeuuuHP0NZni34XWAseFs0sFCRrO

--
-- PostgreSQL database dump
--

\restrict G2xMOQUYpaItXmDBM36fIk482JtvA3UDZvryFrzrHG2bH1WJ0u4FQvHudjnPvgg

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: doc_code_sequences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.doc_code_sequences (type_code, process_code, last_number) FROM stdin;
PR	GLOBAL	2
GU	GLOBAL	3
MN	GLOBAL	1
TR	GLOBAL	5
\.


--
-- Data for Name: document_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.document_types (id, code, label) FROM stdin;
1	PR	Procédures
2	IN	Instructions
3	GU	Guides
4	MN	Manuel
5	TR	Trames
6	EN	Enregistrements
7	FM	Fiches Missions
8	FF	Fiches Fonctions
9	PT	Plan de traitement
10	EX	Externe
\.


--
-- Data for Name: folders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.folders (id, name, code, level, parent_id) FROM stdin;
1	01_PROCESSUS_STRATEGIQUE	01-PS	1	\N
2	02_PROCESSUS_SUPPORT	02-SP	1	\N
3	Concevoir_Developper_Produits	CDP	2	1
4	Faire_Evoluer_Securiser_SI	FESI	2	1
5	Fournir_Prestations_Service	FPS	2	1
6	Gerer_Infrastructure_Environnement_Travail	GIET	2	1
7	Maitriser_Achats_Logistique	MAL	2	2
8	Manager_Sante_Securite_Travail	MSST	2	2
9	Manager_Motiver_Ressources	MMR	2	2
10	Piloter_l_Entreprise	PE	2	2
11	PS_Processus_Strategique	CDP-PS	3	3
384	EN_Enregistrements	FESI-EN	3	4
385	GU_Guides	FESI-GU	3	4
386	IN_Instructions	FESI-IN	3	4
387	PR_Procedures	FESI-PR	3	4
388	TR_Trames	FESI-TR	3	4
389	EN_Enregistrements	FPS-EN	3	5
390	GU_Guides	FPS-GU	3	5
391	IN_Instructions	FPS-IN	3	5
392	PR_Procedures	FPS-PR	3	5
393	TR_Trames	FPS-TR	3	5
394	EN_Enregistrements	GIET-EN	3	6
395	GU_Guides	GIET-GU	3	6
396	IN_Instructions	GIET-IN	3	6
397	PR_Procedures	GIET-PR	3	6
398	TR_Trames	GIET-TR	3	6
399	EN_Enregistrements	MAL-EN	3	7
400	GU_Guides	MAL-GU	3	7
401	IN_Instructions	MAL-IN	3	7
402	PR_Procedures	MAL-PR	3	7
403	TR_Trames	MAL-TR	3	7
404	EN_Enregistrements	MSST-EN	3	8
405	GU_Guides	MSST-GU	3	8
406	IN_Instructions	MSST-IN	3	8
407	PR_Procedures	MSST-PR	3	8
408	TR_Trames	MSST-TR	3	8
409	EN_Enregistrements	MMR-EN	3	9
410	GU_Guides	MMR-GU	3	9
411	IN_Instructions	MMR-IN	3	9
412	PR_Procedures	MMR-PR	3	9
413	TR_Trames	MMR-TR	3	9
414	EN_Enregistrements	PE-EN	3	10
415	GU_Guides	PE-GU	3	10
416	IN_Instructions	PE-IN	3	10
417	PR_Procedures	PE-PR	3	10
418	TR_Trames	PE-TR	3	10
419	EN_Enregistrements	CDP-PS-EN	4	11
420	GU_Guides	CDP-PS-GU	4	11
421	IN_Instructions	CDP-PS-IN	4	11
422	PR_Procedures	CDP-PS-PR	4	11
423	TR_Trames	CDP-PS-TR	4	11
459	MA_Manuel	FPS-MA	3	5
460	FF_Fiches_Fonctions	MMR-FF	3	9
461	FM_Fiches_Missions	MMR-FM	3	9
462	FF_Fiches_Fonctions	PE-FF	3	10
463	FM_Fiches_Missions	PE-FM	3	10
12	PM_Conception_Mecanique	CDP-MC	4	464
13	PM_Conception_Developpement_Logiciel	CDP-DL	4	464
14	PM_Conception_Developpement_Outillages	CDP-DO	4	464
15	PM_Electronique	CDP-EL	4	464
16	PM_Qualification_Thermomecanique	CDP-QT	4	464
17	PM_Validation	CDP-VA	4	464
18	PM_Industrialisation_Vie_Serie	CDP-IVS	4	464
424	EN_Enregistrements	CDP-MC-EN	5	12
425	GU_Guides	CDP-MC-GU	5	12
426	IN_Instructions	CDP-MC-IN	5	12
427	PR_Procedures	CDP-MC-PR	5	12
428	TR_Trames	CDP-MC-TR	5	12
429	EN_Enregistrements	CDP-DL-EN	5	13
430	GU_Guides	CDP-DL-GU	5	13
431	IN_Instructions	CDP-DL-IN	5	13
432	PR_Procedures	CDP-DL-PR	5	13
433	TR_Trames	CDP-DL-TR	5	13
434	EN_Enregistrements	CDP-DO-EN	5	14
435	GU_Guides	CDP-DO-GU	5	14
436	IN_Instructions	CDP-DO-IN	5	14
437	PR_Procedures	CDP-DO-PR	5	14
438	TR_Trames	CDP-DO-TR	5	14
439	EN_Enregistrements	CDP-EL-EN	5	15
440	GU_Guides	CDP-EL-GU	5	15
441	IN_Instructions	CDP-EL-IN	5	15
442	PR_Procedures	CDP-EL-PR	5	15
443	TR_Trames	CDP-EL-TR	5	15
464	PM_Processus_Metiers	01-CDP-PM	3	3
444	EN_Enregistrements	CDP-QT-EN	5	16
445	GU_Guides	CDP-QT-GU	5	16
446	IN_Instructions	CDP-QT-IN	5	16
447	PR_Procedures	CDP-QT-PR	5	16
448	TR_Trames	CDP-QT-TR	5	16
449	EN_Enregistrements	CDP-VA-EN	5	17
450	GU_Guides	CDP-VA-GU	5	17
451	IN_Instructions	CDP-VA-IN	5	17
452	PR_Procedures	CDP-VA-PR	5	17
453	TR_Trames	CDP-VA-TR	5	17
454	EN_Enregistrements	CDP-IVS-EN	5	18
455	GU_Guides	CDP-IVS-GU	5	18
456	IN_Instructions	CDP-IVS-IN	5	18
457	PR_Procedures	CDP-IVS-PR	5	18
458	TR_Trames	CDP-IVS-TR	5	18
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, description) FROM stdin;
1	Admin	Accès complet — gestion utilisateurs, archivage, workflow
2	Ing. Qualité	Création, modification et soumission de documents
3	Reviewer	Relecture et validation des documents
\.


--
-- Data for Name: status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.status (id, name) FROM stdin;
1	Brouillon
2	En rédaction
3	En relecture
4	En validation
5	Validé
6	Diffusé
7	Obsolète
8	Archivé
9	Approuvé
14	Appel en relecture
15	En correction
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password_hash, role_id, is_active, last_login, requested_role, created_at, last_login_ip, login_attempts, locked_until) FROM stdin;
2	Ing Qualité	ing@test.com	$2b$10$m7oWtolqZVA4r/csfMBf/u7n59GRdctZS4XqraTYu3k8TM720Yc1W	2	t	2026-05-08 14:30:07.178877+00	\N	2026-05-01 17:11:29.396869+00	172.18.0.1	0	\N
4	Moetez Hamzaoui	motezhm40@gmail.com	$2b$10$I545HIRL8IeT9TMl2en3JOQULLv5p82KZE88Am5We/jFCOkbySXKS	3	t	\N	Reviewer	2026-05-01 21:03:21.505708+00	\N	0	\N
1	Admin	admin@test.com	$2b$10$0fmRdfXoytHRmeS0aXnCyu9kP/OZu3t/EIho.WadYNilSG11rrgOe	1	t	2026-05-08 12:47:58.687284+00	\N	2026-05-01 17:11:29.323219+00	172.18.0.1	0	\N
3	Reviewer	reviewer@test.com	$2b$10$71O2rjQ4ddPAOTFGi99dx.jD53lN5Th3gSCW1uongwJR07CvcFTnC	3	t	2026-05-08 14:23:01.66924+00	\N	2026-05-01 17:11:29.466352+00	172.18.0.1	0	\N
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documents (id, doc_code, title, responsible, next_review_date, status_id, current_version, folder_id, type_id, process_id, created_by, origin, context, project_ref, keywords, file_path, file_name, file_size, mime_type, created_at, updated_at, reviewer_emails, validator_emails, sharepoint_link, validated_version) FROM stdin;
6	GU0001_Guide_-	Guide	Moetez	2026-06-05	14	-	405	3	405	2	INTERNE	PROCESSUS	\N	{gu}	02_PROCESSUS_SUPPORT/Manager_Sante_Securite_Travail/GU_Guides/GU0001_Guide_-.pdf	GU0001_Guide_-.pdf	110471	application/pdf	2026-05-01 21:09:16.440759+00	2026-05-01 21:09:16.440759+00	{motezhm40@gmail.com}	\N	\N	\N
9	TR0004_Trame_A	Trame	Moetez	2026-05-28	3	A	413	5	413	1	INTERNE	SYSTEME_QUALITE	\N	{tr}	02_PROCESSUS_SUPPORT/Manager_Motiver_Ressources/TR_Trames/TR0004_Trame_A.pdf	TR0004_Trame_A.pdf	110471	application/pdf	2026-05-06 09:47:03.511795+00	2026-05-06 09:47:03.511795+00	{motezhm40@gmail.com}	\N	\N	\N
10	GU0003_Guide_A	Guide	Moetez	2026-05-20	1	A	415	3	415	2	EXTERNE	PROCESSUS	\N	{gu}	02_PROCESSUS_SUPPORT/Piloter_l_Entreprise/GU_Guides/GU0003_Guide_A.pdf	GU0003_Guide_A.pdf	110471	application/pdf	2026-05-06 14:19:05.111441+00	2026-05-06 14:19:05.111441+00	{motezhm40@gmail.com,reviewer@test.com}	\N	\N	\N
3	PR0001_Procedure_-	Procédure	Moetez	2026-05-28	9	-	407	1	407	1	INTERNE	SYSTEME_QUALITE	\N	{pr}	02_PROCESSUS_SUPPORT/Manager_Sante_Securite_Travail/PR_Procedures/PR0001_Procedure_-.pdf	PR0001_Procedure_-.pdf	110471	application/pdf	2026-05-01 18:36:27.19572+00	2026-05-01 18:36:27.19572+00	{rev@test.com}	\N	https://mohetn.sharepoint.com/:b:/s/SMQ_GED/IQCw9fXvmCrMT65qsgFIceznAeZplQtudkr6nikDw9WYLKs?e=yb3CNw	-
8	GU0002_Guide_A	Guide	Alison	2026-06-04	4	A	395	3	395	2	EXTERNE	PROCESSUS	\N	{gu}	01_PROCESSUS_STRATEGIQUE/Gerer_Infrastructure_Environnement_Travail/GU_Guides/GU0002_Guide_A.pdf	GU0002_Guide_A.pdf	110471	application/pdf	2026-05-03 09:56:59.916292+00	2026-05-03 09:56:59.916292+00	{motezhm40@gmail.com}	\N	\N	\N
2	TR0001_Trame_A1	Trame	Moetez	2026-06-26	8	A1	8	5	8	2	INTERNE	SYSTEME_QUALITE	\N	{tr}	02_PROCESSUS_SUPPORT/Manager_Sante_Securite_Travail/TR0001_Trame_A1.pdf	TR0001_Trame_A1.pdf	110471	application/pdf	2026-05-01 17:26:19.892033+00	2026-05-01 17:26:19.892033+00	{rev@test.com}	\N	\N	\N
4	TR0002_Trame_-	Trame	Moetez	2026-03-25	8	-	393	5	393	2	INTERNE	PROCESSUS	\N	{tr}	01_PROCESSUS_STRATEGIQUE/Fournir_Prestations_Service/TR_Trames/TR0002_Trame_-.pdf	TR0002_Trame_-.pdf	110471	application/pdf	2026-05-01 21:00:59.373113+00	2026-05-01 21:00:59.373113+00	{reviewer@test.com}	\N	\N	-
5	PR0002_Procedure_-	Procédure	moetez	2026-04-22	14	-	402	1	402	1	EXTERNE	PROJET	\N	{pr}	02_PROCESSUS_SUPPORT/Maitriser_Achats_Logistique/PR_Procedures/PR0002_Procedure_-.pdf	PR0002_Procedure_-.pdf	110471	application/pdf	2026-05-01 21:05:15.828924+00	2026-05-01 21:05:15.828924+00	{motezhm40@gmail.com}	\N	\N	\N
7	TR0003_Trame_A2	Trame	Moetez	2026-05-28	4	A2	393	5	393	2	INTERNE	SUPPORT	\N	{tr}	01_PROCESSUS_STRATEGIQUE/Fournir_Prestations_Service/TR_Trames/TR0003_Trame_A2.pdf	TR0003_Trame_A2.pdf	110471	application/pdf	2026-05-02 10:29:31.701291+00	2026-05-02 10:29:31.701291+00	{motezhm40@gmail.com}	\N	https://mohetn.sharepoint.com/:b:/s/SMQ_GED/IQCw9fXvmCrMT65qsgFIceznAeZplQtudkr6nikDw9WYLKs?e=p0Qkuc	\N
11	MN0001_Manuel_A	Manuel	Alison	2026-04-17	1	A	459	4	459	2	EXTERNE	SUPPORT	\N	{mn}	01_PROCESSUS_STRATEGIQUE/Fournir_Prestations_Service/MA_Manuel/MN0001_Manuel_A.pdf	MN0001_Manuel_A.pdf	110471	application/pdf	2026-05-08 14:32:00.035322+00	2026-05-08 14:32:00.035322+00	{motezhm40@gmail.com}	\N	https://mohetn.sharepoint.com/:b:/s/SMQ_GED/IQCw9fXvmCrMT65qsgFIceznAeZplQtudkr6nikDw9WYLKs?e=5Zymj6	\N
12	TR0005_Trame_-	Trame	Moetez	2026-05-30	1	-	418	5	418	2	INTERNE	SUPPORT	\N	{tr}	02_PROCESSUS_SUPPORT/Piloter_l_Entreprise/TR_Trames/TR0005_Trame_-.pdf	TR0005_Trame_-.pdf	110471	application/pdf	2026-05-08 15:09:16.017493+00	2026-05-08 15:09:16.017493+00	{motezhm40@gmail.com,reviewer@test.com}	\N	https://mohetn.sharepoint.com/:b:/s/SMQ_GED/IQCw9fXvmCrMT65qsgFIceznAeZplQtudkr6nikDw9WYLKs?e=ENuUZw	\N
\.


--
-- Data for Name: logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.logs (id, document_id, action, user_id, details, created_at, ip_address, user_agent, severity) FROM stdin;
10	2	CREATE_DOCUMENT	2	{"origin": "INTERNE", "doc_code": "TR0001_Trame_-", "typeCode": "TR", "folderCode": "MSST"}	2026-05-01 17:26:19.892033+00	\N	\N	info
11	2	STATUS_CHANGE	\N	{"to": "En rédaction", "from": "Brouillon", "doc_code": "TR0001_Trame_-", "timestamp": "2026-05-01T17:27:41.526Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 17:27:41.522987+00	\N	\N	info
12	2	NEW_VERSION	2	{"to": "A", "from": "-", "change_summary": "test"}	2026-05-01 17:28:10.21874+00	\N	\N	info
13	2	STATUS_CHANGE	\N	{"to": "Appel en relecture", "from": "En rédaction", "doc_code": "TR0001_Trame_A", "timestamp": "2026-05-01T17:34:30.921Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 17:34:30.912968+00	\N	\N	info
14	2	STATUS_CHANGE	\N	{"to": "En relecture", "from": "Appel en relecture", "doc_code": "TR0001_Trame_A", "timestamp": "2026-05-01T17:34:31.859Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 17:34:31.85289+00	\N	\N	info
15	2	STATUS_CHANGE	\N	{"to": "En validation", "from": "En relecture", "doc_code": "TR0001_Trame_A", "timestamp": "2026-05-01T17:34:40.388Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 17:34:40.381201+00	\N	\N	info
16	2	VERSION_SUPERSEDED	2	{"reason": "Remplacée par une nouvelle version", "doc_code": "TR0001_Trame_A", "new_version": "A1", "superseded_version": "A"}	2026-05-01 17:35:09.862233+00	\N	\N	info
17	2	NEW_VERSION	2	{"to": "A1", "from": "A", "change_summary": "ttttt"}	2026-05-01 17:35:09.862233+00	\N	\N	info
19	3	CREATE_DOCUMENT	1	{"origin": "INTERNE", "doc_code": "PR0001_Procedure_-", "typeCode": "PR", "folderCode": "MSST-PR"}	2026-05-01 18:36:27.19572+00	\N	\N	info
25	2	VALIDATION_CREATED	1	{"comment": "correct", "version": "A1", "decision": "APPROUVÉ", "doc_code": "TR0001_Trame_A1", "validator_id": 1, "validation_id": 1, "signature_hash": "988d452a6543fed54f6da83f143150f6c50c4706989a6ea82a11de072f48ee5b", "validator_name": "Admin"}	2026-05-01 18:43:10.973275+00	\N	\N	info
26	2	STATUS_CHANGE	1	{"to": "Validé", "from": "En validation", "trigger": "auto_approval"}	2026-05-01 18:43:10.973275+00	\N	\N	info
34	4	CREATE_DOCUMENT	2	{"origin": "INTERNE", "doc_code": "TR0002_Trame_-", "typeCode": "TR", "folderCode": "FPS-TR"}	2026-05-01 21:00:59.373113+00	\N	\N	info
37	5	CREATE_DOCUMENT	1	{"origin": "EXTERNE", "doc_code": "PR0002_Procedure_-", "typeCode": "PR", "folderCode": "MAL-PR"}	2026-05-01 21:05:15.828924+00	\N	\N	info
40	6	CREATE_DOCUMENT	2	{"origin": "INTERNE", "doc_code": "GU0001_Guide_-", "typeCode": "GU", "folderCode": "MSST-GU"}	2026-05-01 21:09:16.440759+00	\N	\N	info
41	3	STATUS_CHANGE	\N	{"to": "En rédaction", "from": "Brouillon", "doc_code": "PR0001_Procedure_-", "timestamp": "2026-05-01T21:09:23.381Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 21:09:23.375867+00	\N	\N	info
42	3	STATUS_CHANGE	\N	{"to": "Appel en relecture", "from": "En rédaction", "doc_code": "PR0001_Procedure_-", "timestamp": "2026-05-01T21:09:24.129Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 21:09:24.121503+00	\N	\N	info
43	3	STATUS_CHANGE	\N	{"to": "En relecture", "from": "Appel en relecture", "doc_code": "PR0001_Procedure_-", "timestamp": "2026-05-01T21:09:24.655Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 21:09:24.640874+00	\N	\N	info
44	3	STATUS_CHANGE	\N	{"to": "En validation", "from": "En relecture", "doc_code": "PR0001_Procedure_-", "timestamp": "2026-05-01T21:10:02.131Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 21:10:02.125138+00	\N	\N	info
45	2	STATUS_CHANGE	\N	{"to": "Approuvé", "from": "Validé", "doc_code": "TR0001_Trame_A1", "timestamp": "2026-05-01T21:10:17.208Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 21:10:17.20159+00	\N	\N	info
46	2	STATUS_CHANGE	\N	{"to": "Diffusé", "from": "Approuvé", "doc_code": "TR0001_Trame_A1", "timestamp": "2026-05-01T21:10:17.975Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 21:10:17.96532+00	\N	\N	info
47	2	STATUS_CHANGE	\N	{"to": "Obsolète", "from": "Diffusé", "doc_code": "TR0001_Trame_A1", "timestamp": "2026-05-01T21:10:18.199Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 21:10:18.194667+00	\N	\N	info
48	2	STATUS_CHANGE	\N	{"to": "Archivé", "from": "Obsolète", "doc_code": "TR0001_Trame_A1", "timestamp": "2026-05-01T21:10:18.385Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 21:10:18.377612+00	\N	\N	info
49	6	STATUS_CHANGE	\N	{"to": "En rédaction", "from": "Brouillon", "doc_code": "GU0001_Guide_-", "timestamp": "2026-05-01T21:12:33.943Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 21:12:33.937982+00	\N	\N	info
50	6	STATUS_CHANGE	\N	{"to": "Appel en relecture", "from": "En rédaction", "doc_code": "GU0001_Guide_-", "timestamp": "2026-05-01T21:12:34.653Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 21:12:34.648888+00	\N	\N	info
51	4	STATUS_CHANGE	\N	{"to": "En rédaction", "from": "Brouillon", "doc_code": "TR0002_Trame_-", "timestamp": "2026-05-01T21:12:38.830Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 21:12:38.824485+00	\N	\N	info
52	4	STATUS_CHANGE	\N	{"to": "Appel en relecture", "from": "En rédaction", "doc_code": "TR0002_Trame_-", "timestamp": "2026-05-01T21:12:38.985Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 21:12:38.980568+00	\N	\N	info
53	4	STATUS_CHANGE	\N	{"to": "En relecture", "from": "Appel en relecture", "doc_code": "TR0002_Trame_-", "timestamp": "2026-05-01T21:12:40.033Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 21:12:40.029919+00	\N	\N	info
54	4	STATUS_CHANGE	\N	{"to": "En correction", "from": "En relecture", "doc_code": "TR0002_Trame_-", "timestamp": "2026-05-01T21:12:40.926Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-01 21:12:40.92142+00	\N	\N	info
85	7	CREATE_DOCUMENT	2	{"origin": "INTERNE", "doc_code": "TR0003_Trame_-", "typeCode": "TR", "folderCode": "FPS-TR"}	2026-05-02 10:29:31.701291+00	\N	\N	info
87	8	CREATE_DOCUMENT	2	{"origin": "EXTERNE", "doc_code": "GU0002_Guide_-", "typeCode": "GU", "folderCode": "GIET-GU"}	2026-05-03 09:56:59.916292+00	\N	\N	info
88	4	STATUS_CHANGE	\N	{"to": "Appel en relecture", "from": "En correction", "doc_code": "TR0002_Trame_-", "timestamp": "2026-05-03T09:57:09.872Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-03 09:57:09.860057+00	\N	\N	info
89	4	STATUS_CHANGE	\N	{"to": "En relecture", "from": "Appel en relecture", "doc_code": "TR0002_Trame_-", "timestamp": "2026-05-03T09:57:11.474Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-03 09:57:11.469357+00	\N	\N	info
90	4	STATUS_CHANGE	\N	{"to": "En validation", "from": "En relecture", "doc_code": "TR0002_Trame_-", "timestamp": "2026-05-03T09:57:14.825Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-03 09:57:14.817805+00	\N	\N	info
91	7	STATUS_CHANGE	\N	{"to": "En rédaction", "from": "Brouillon", "doc_code": "TR0003_Trame_-", "timestamp": "2026-05-03T09:57:31.602Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-03 09:57:31.596712+00	\N	\N	info
92	7	STATUS_CHANGE	\N	{"to": "Appel en relecture", "from": "En rédaction", "doc_code": "TR0003_Trame_-", "timestamp": "2026-05-03T09:57:31.753Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-03 09:57:31.746136+00	\N	\N	info
93	7	STATUS_CHANGE	\N	{"to": "En relecture", "from": "Appel en relecture", "doc_code": "TR0003_Trame_-", "timestamp": "2026-05-03T09:57:31.895Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-03 09:57:31.892452+00	\N	\N	info
94	7	STATUS_CHANGE	\N	{"to": "En correction", "from": "En relecture", "doc_code": "TR0003_Trame_-", "timestamp": "2026-05-03T09:57:32.054Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-03 09:57:32.052895+00	\N	\N	info
95	7	NEW_VERSION	2	{"to": "A", "from": "-", "change_summary": "ttesstt"}	2026-05-03 09:58:02.250825+00	\N	\N	info
96	8	NEW_VERSION	2	{"to": "A", "from": "-", "change_summary": "tt"}	2026-05-03 10:07:47.188957+00	\N	\N	info
99	8	STATUS_CHANGE	\N	{"to": "En rédaction", "from": "Brouillon", "doc_code": "GU0002_Guide_A", "timestamp": "2026-05-03T10:29:45.210Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-03 10:29:45.205215+00	\N	\N	info
100	8	STATUS_CHANGE	\N	{"to": "Appel en relecture", "from": "En rédaction", "doc_code": "GU0002_Guide_A", "timestamp": "2026-05-03T10:29:48.934Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-03 10:29:48.927425+00	\N	\N	info
103	3	VALIDATION_CREATED	3	{"comment": "", "version": "-", "decision": "APPROUVÉ", "doc_code": "PR0001_Procedure_-", "validator_id": 3, "validation_id": 2, "signature_hash": "311fc33c14da1b24a43fa40a027bb154ca2739bb5e98a1e66c9b34b384da629c", "validator_name": "Reviewer"}	2026-05-03 10:57:18.043327+00	\N	\N	info
104	4	VALIDATION_CREATED	3	{"comment": "", "version": "-", "decision": "APPROUVÉ", "doc_code": "TR0002_Trame_-", "validator_id": 3, "validation_id": 3, "signature_hash": "8f98127ac05554272a004e2aa4fd26bf06fd0bf3b3eeed0a348dd699b7960d39", "validator_name": "Reviewer"}	2026-05-03 10:57:31.45137+00	\N	\N	info
106	4	STATUS_CHANGE	\N	{"to": "Validé", "from": "En validation", "doc_code": "TR0002_Trame_-", "timestamp": "2026-05-03T10:57:57.429Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-03 10:57:57.41787+00	\N	\N	info
107	4	STATUS_CHANGE	\N	{"to": "Approuvé", "from": "Validé", "doc_code": "TR0002_Trame_-", "timestamp": "2026-05-03T10:57:58.695Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-03 10:57:58.691919+00	\N	\N	info
108	4	STATUS_CHANGE	\N	{"to": "Diffusé", "from": "Approuvé", "doc_code": "TR0002_Trame_-", "timestamp": "2026-05-03T10:57:59.317Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-03 10:57:59.313487+00	\N	\N	info
109	4	STATUS_CHANGE	\N	{"to": "Obsolète", "from": "Diffusé", "doc_code": "TR0002_Trame_-", "timestamp": "2026-05-03T10:57:59.674Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-03 10:57:59.669249+00	\N	\N	info
110	4	STATUS_CHANGE	\N	{"to": "Archivé", "from": "Obsolète", "doc_code": "TR0002_Trame_-", "timestamp": "2026-05-03T10:58:00.480Z", "user_role": "Ing. Qualité", "ISO_transition": true}	2026-05-03 10:58:00.474698+00	\N	\N	info
113	3	STATUS_CHANGE	\N	{"to": "Validé", "from": "En validation", "doc_code": "PR0001_Procedure_-", "timestamp": "2026-05-03T11:56:15.893Z", "user_role": "Admin", "ISO_transition": true}	2026-05-03 11:56:15.880396+00	\N	\N	info
115	5	STATUS_CHANGE	\N	{"to": "En rédaction", "from": "Brouillon", "doc_code": "PR0002_Procedure_-", "timestamp": "2026-05-03T14:52:50.577Z", "user_role": "Admin", "ISO_transition": true}	2026-05-03 14:52:50.569374+00	\N	\N	info
116	5	STATUS_CHANGE	\N	{"to": "Appel en relecture", "from": "En rédaction", "doc_code": "PR0002_Procedure_-", "timestamp": "2026-05-03T14:53:00.497Z", "user_role": "Admin", "ISO_transition": true}	2026-05-03 14:53:00.49049+00	\N	\N	info
117	7	STATUS_CHANGE	\N	{"to": "Appel en relecture", "from": "En correction", "doc_code": "TR0003_Trame_A", "timestamp": "2026-05-03T14:59:59.074Z", "user_role": "Admin", "ISO_transition": true}	2026-05-03 14:59:59.06207+00	\N	\N	info
118	7	STATUS_CHANGE	\N	{"to": "En relecture", "from": "Appel en relecture", "doc_code": "TR0003_Trame_A", "timestamp": "2026-05-03T15:02:43.422Z", "user_role": "Admin", "ISO_transition": true}	2026-05-03 15:02:43.41381+00	\N	\N	info
119	7	STATUS_CHANGE	\N	{"to": "En correction", "from": "En relecture", "doc_code": "TR0003_Trame_A", "timestamp": "2026-05-03T15:02:48.514Z", "user_role": "Admin", "ISO_transition": true}	2026-05-03 15:02:48.506044+00	\N	\N	info
120	7	STATUS_CHANGE	\N	{"to": "En relecture", "from": "En correction", "doc_code": "TR0003_Trame_A", "timestamp": "2026-05-03T15:02:50.894Z", "user_role": "Admin", "ISO_transition": true}	2026-05-03 15:02:50.88584+00	\N	\N	info
121	7	STATUS_CHANGE	\N	{"to": "Appel en relecture", "from": "En relecture", "doc_code": "TR0003_Trame_A", "timestamp": "2026-05-03T15:02:55.039Z", "user_role": "Admin", "ISO_transition": true}	2026-05-03 15:02:55.033729+00	\N	\N	info
124	7	STATUS_CHANGE	\N	{"to": "En relecture", "from": "Appel en relecture", "doc_code": "TR0003_Trame_A", "timestamp": "2026-05-03T16:30:02.944Z", "user_role": "Admin", "ISO_transition": true}	2026-05-03 16:30:02.927106+00	\N	\N	info
125	7	STATUS_CHANGE	\N	{"to": "En validation", "from": "En relecture", "doc_code": "TR0003_Trame_A", "timestamp": "2026-05-03T16:30:05.392Z", "user_role": "Admin", "ISO_transition": true}	2026-05-03 16:30:05.384153+00	\N	\N	info
126	8	STATUS_CHANGE	\N	{"to": "En relecture", "from": "Appel en relecture", "doc_code": "GU0002_Guide_A", "timestamp": "2026-05-03T17:15:38.290Z", "user_role": "Admin", "ISO_transition": true}	2026-05-03 17:15:38.281685+00	\N	\N	info
127	8	STATUS_CHANGE	\N	{"to": "En validation", "from": "En relecture", "doc_code": "GU0002_Guide_A", "timestamp": "2026-05-03T17:15:41.151Z", "user_role": "Admin", "ISO_transition": true}	2026-05-03 17:15:41.143941+00	\N	\N	info
132	7	VERSION_SUPERSEDED	2	{"reason": "Remplacée par une nouvelle version", "doc_code": "TR0003_Trame_A", "new_version": "A1", "superseded_version": "A"}	2026-05-04 08:12:28.099569+00	\N	\N	info
133	7	NEW_VERSION	2	{"to": "A1", "from": "A", "change_summary": "test"}	2026-05-04 08:12:28.099569+00	\N	\N	info
134	\N	LOGIN_FAILURE	\N	{"email": "reviewer@tes.com", "reason": "user_not_found"}	2026-05-08 14:22:52.096298+00	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	warning
135	\N	LOGIN_NEW_IP	3	{"email": "reviewer@test.com", "current_ip": "172.18.0.1", "previous_ip": "::ffff:172.18.0.1"}	2026-05-08 14:23:01.651773+00	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	warning
136	\N	LOGIN_SUCCESS	3	{"ip": "172.18.0.1", "role": "Reviewer", "email": "reviewer@test.com"}	2026-05-08 14:23:01.686032+00	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	info
137	\N	ACCESS_DENIED_403	3	{"path": "/api/users", "role": "Reviewer", "method": "GET", "required": ["Admin", "Ing. Qualité"]}	2026-05-08 14:29:49.591164+00	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	warning
138	\N	LOGIN_SUCCESS	2	{"ip": "172.18.0.1", "role": "Ing. Qualité", "email": "ing@test.com"}	2026-05-08 14:30:07.188697+00	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	info
139	11	CREATE_DOCUMENT	2	{"origin": "EXTERNE", "doc_code": "MN0001_Manuel_-", "typeCode": "MN", "folderCode": "FPS-MA"}	2026-05-08 14:32:00.035322+00	\N	\N	info
140	11	NEW_VERSION	2	{"to": "A", "from": "-", "change_summary": "vvvvv"}	2026-05-08 14:50:40.842712+00	\N	\N	info
141	12	CREATE_DOCUMENT	2	{"origin": "INTERNE", "doc_code": "TR0005_Trame_-", "typeCode": "TR", "folderCode": "PE-TR"}	2026-05-08 15:09:16.017493+00	\N	\N	info
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, document_id, message, type, is_read, created_at) FROM stdin;
1	1	2	[TR0001_Trame_-] "Trame" — nouvelle version (A) créée par Ing Qualité (Ing. Qualité). Résumé : "test".	version	f	2026-05-01 17:28:10.312955+00
2	2	2	[TR0001_Trame_-] "Trame" — nouvelle version (A) créée par Ing Qualité (Ing. Qualité). Résumé : "test".	version	f	2026-05-01 17:28:10.327588+00
3	1	2	[TR0001_Trame_A] "Trame" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-01 17:34:30.952098+00
4	2	2	[TR0001_Trame_A] "Trame" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-01 17:34:30.95944+00
5	3	2	[TR0001_Trame_A] "Trame" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	t	2026-05-01 17:34:30.97073+00
6	1	4	[TR0002_Trame_-] "Trame" — date de révision dépassée depuis 37 jour(s) (prévue le 25/03/2026). Une révision est requise.	expiration	f	2026-05-01 21:04:22.269667+00
7	1	5	[PR0002_Procedure_-] "Procédure" — date de révision dépassée depuis 9 jour(s) (prévue le 22/04/2026). Une révision est requise.	expiration	f	2026-05-01 21:05:43.896373+00
8	1	3	[PR0001_Procedure_-] "Procédure" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-01 21:09:24.143972+00
9	2	3	[PR0001_Procedure_-] "Procédure" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-01 21:09:24.14983+00
10	4	3	[PR0001_Procedure_-] "Procédure" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-01 21:09:24.152826+00
11	3	3	[PR0001_Procedure_-] "Procédure" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-01 21:09:24.158134+00
12	3	2	[TR0001_Trame_A1] "Trame" diffusé par Ing Qualité (Ing. Qualité) — disponible à la consultation.	version	f	2026-05-01 21:10:17.989108+00
13	4	2	[TR0001_Trame_A1] "Trame" diffusé par Ing Qualité (Ing. Qualité) — disponible à la consultation.	version	f	2026-05-01 21:10:18.00067+00
14	1	2	[TR0001_Trame_A1] "Trame" marqué Obsolète par Ing Qualité (Ing. Qualité). Ce document ne doit plus être utilisé.	expiration	f	2026-05-01 21:10:18.212458+00
15	1	6	[GU0001_Guide_-] "Guide" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-01 21:12:34.668795+00
17	4	6	[GU0001_Guide_-] "Guide" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-01 21:12:34.679859+00
18	3	6	[GU0001_Guide_-] "Guide" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-01 21:12:34.682194+00
19	1	4	[TR0002_Trame_-] "Trame" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-01 21:12:39.001493+00
20	2	4	[TR0002_Trame_-] "Trame" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-01 21:12:39.008901+00
21	4	4	[TR0002_Trame_-] "Trame" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-01 21:12:39.012476+00
22	3	4	[TR0002_Trame_-] "Trame" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-01 21:12:39.015029+00
48	1	7	[TR0003_Trame_-] "Trame" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-03 09:57:31.769264+00
49	2	7	[TR0003_Trame_-] "Trame" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-03 09:57:31.777911+00
50	4	7	[TR0003_Trame_-] "Trame" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-03 09:57:31.786317+00
52	1	7	[TR0003_Trame_-] "Trame" — nouvelle version (A) créée par Ing Qualité (Ing. Qualité). Résumé : "ttesstt".	version	f	2026-05-03 09:58:02.358537+00
53	2	7	[TR0003_Trame_-] "Trame" — nouvelle version (A) créée par Ing Qualité (Ing. Qualité). Résumé : "ttesstt".	version	f	2026-05-03 09:58:02.370276+00
54	1	8	[GU0002_Guide_-] "Guide" — nouvelle version (A) créée par Ing Qualité (Ing. Qualité). Résumé : "tt".	version	f	2026-05-03 10:07:47.283786+00
55	2	8	[GU0002_Guide_-] "Guide" — nouvelle version (A) créée par Ing Qualité (Ing. Qualité). Résumé : "tt".	version	f	2026-05-03 10:07:47.299162+00
56	1	8	[GU0002_Guide_A] "Guide" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-03 10:29:48.949806+00
57	2	8	[GU0002_Guide_A] "Guide" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-03 10:29:48.96173+00
58	4	8	[GU0002_Guide_A] "Guide" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-03 10:29:48.966846+00
59	3	8	[GU0002_Guide_A] "Guide" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-03 10:29:48.976293+00
16	2	6	[GU0001_Guide_-] "Guide" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	t	2026-05-01 21:12:34.675925+00
60	1	4	[TR0002_Trame_-] "Trame" diffusé par Ing Qualité (Ing. Qualité) — disponible à la consultation.	version	f	2026-05-03 10:57:59.331124+00
61	4	4	[TR0002_Trame_-] "Trame" diffusé par Ing Qualité (Ing. Qualité) — disponible à la consultation.	version	f	2026-05-03 10:57:59.33838+00
62	3	4	[TR0002_Trame_-] "Trame" diffusé par Ing Qualité (Ing. Qualité) — disponible à la consultation.	version	f	2026-05-03 10:57:59.347633+00
63	2	4	[TR0002_Trame_-] "Trame" diffusé par Ing Qualité (Ing. Qualité) — disponible à la consultation.	version	f	2026-05-03 10:57:59.355634+00
64	1	5	[PR0002_Procedure_-] "Procédure" — appel en relecture émis par Admin (Admin). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-03 14:53:00.513564+00
65	2	5	[PR0002_Procedure_-] "Procédure" — appel en relecture émis par Admin (Admin). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-03 14:53:00.522199+00
66	3	5	[PR0002_Procedure_-] "Procédure" — appel en relecture émis par Admin (Admin). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-03 14:53:00.525467+00
67	4	5	[PR0002_Procedure_-] "Procédure" — appel en relecture émis par Admin (Admin). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-03 14:53:00.528913+00
68	1	9	[TR0004_Trame_-] "Trame" — appel en relecture émis par Admin (Admin). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-06 09:47:24.060454+00
69	2	9	[TR0004_Trame_-] "Trame" — appel en relecture émis par Admin (Admin). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-06 09:47:24.071775+00
70	3	9	[TR0004_Trame_-] "Trame" — appel en relecture émis par Admin (Admin). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-06 09:47:24.079464+00
71	4	9	[TR0004_Trame_-] "Trame" — appel en relecture émis par Admin (Admin). Une nouvelle version est disponible pour relecture.	validation	f	2026-05-06 09:47:24.084987+00
72	2	9	[TR0004_Trame_-] "Trame" — nouvelle version (A) créée par Admin (Admin). Résumé : "test version".	version	f	2026-05-06 09:47:43.541075+00
73	1	9	[TR0004_Trame_-] "Trame" — nouvelle version (A) créée par Admin (Admin). Résumé : "test version".	version	f	2026-05-06 09:47:43.558689+00
74	2	10	[GU0003_Guide_-] "Guide" — nouvelle version (A) créée par Ing Qualité (Ing. Qualité). Résumé : "te".	version	f	2026-05-06 14:33:19.426496+00
75	1	10	[GU0003_Guide_-] "Guide" — nouvelle version (A) créée par Ing Qualité (Ing. Qualité). Résumé : "te".	version	f	2026-05-06 14:33:19.447984+00
51	3	7	[TR0003_Trame_-] "Trame" — appel en relecture émis par Ing Qualité (Ing. Qualité). Une nouvelle version est disponible pour relecture.	validation	t	2026-05-03 09:57:31.794551+00
76	1	11	[MN0001_Manuel_-] "Manuel" — date de révision dépassée depuis 21 jour(s) (prévue le 17/04/2026). Une révision est requise.	expiration	f	2026-05-08 14:47:39.620252+00
77	2	11	[MN0001_Manuel_-] "Manuel" — nouvelle version (A) créée par Ing Qualité (Ing. Qualité). Résumé : "vvvvv".	version	f	2026-05-08 14:50:40.961808+00
78	1	11	[MN0001_Manuel_-] "Manuel" — nouvelle version (A) créée par Ing Qualité (Ing. Qualité). Résumé : "vvvvv".	version	f	2026-05-08 14:50:40.973747+00
\.


--
-- Data for Name: processes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.processes (id, code, strategic_process, main_process, sub_process) FROM stdin;
1	CDP	01_PROCESSUS_STRATEGIQUE	Concevoir_Developper_Produits	Concevoir_Developper_Produits
2	FESI	01_PROCESSUS_STRATEGIQUE	Faire_Evoluer_Securiser_SI	Faire_Evoluer_Securiser_SI
3	FPS	01_PROCESSUS_STRATEGIQUE	Fournir_Prestations_Service	Fournir_Prestations_Service
4	GIET	01_PROCESSUS_STRATEGIQUE	Gerer_Infrastructure_Environnement_Travail	Gerer_Infrastructure_Environnement_Travail
5	MAL	02_PROCESSUS_SUPPORT	Maitriser_Achats_Logistique	Maitriser_Achats_Logistique
6	MSST	02_PROCESSUS_SUPPORT	Manager_Sante_Securite_Travail	Manager_Sante_Securite_Travail
7	MMR	02_PROCESSUS_SUPPORT	Manager_Motiver_Ressources	Manager_Motiver_Ressources
8	PE	02_PROCESSUS_SUPPORT	Piloter_l_Entreprise	Piloter_l_Entreprise
9	CDP-PS	01_PROCESSUS_STRATEGIQUE	Concevoir_Developper_Produits	PS_Processus_Strategique
10	CDP-MC	01_PROCESSUS_STRATEGIQUE	Concevoir_Developper_Produits	PM_Conception_Mecanique
11	CDP-DL	01_PROCESSUS_STRATEGIQUE	Concevoir_Developper_Produits	PM_Conception_Developpement_Logiciel
12	CDP-DO	01_PROCESSUS_STRATEGIQUE	Concevoir_Developper_Produits	PM_Conception_Developpement_Outillages
13	CDP-EL	01_PROCESSUS_STRATEGIQUE	Concevoir_Developper_Produits	PM_Electronique
14	CDP-QT	01_PROCESSUS_STRATEGIQUE	Concevoir_Developper_Produits	PM_Qualification_Thermomecanique
15	CDP-VA	01_PROCESSUS_STRATEGIQUE	Concevoir_Developper_Produits	PM_Validation
16	CDP-IVS	01_PROCESSUS_STRATEGIQUE	Concevoir_Developper_Produits	PM_Industrialisation_Vie_Serie
\.


--
-- Data for Name: validations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.validations (id, document_id, validator_id, validator_name, validated_at, comment, decision, version_letter, signature_hash, is_locked, created_at, updated_at) FROM stdin;
1	2	1	Admin	2026-05-01 18:43:10.973275+00	correct	APPROUVÉ	A1	988d452a6543fed54f6da83f143150f6c50c4706989a6ea82a11de072f48ee5b	t	2026-05-01 18:43:10.973275+00	2026-05-01 18:43:10.973275+00
2	3	3	Reviewer	2026-05-03 10:57:18.043327+00		APPROUVÉ	-	311fc33c14da1b24a43fa40a027bb154ca2739bb5e98a1e66c9b34b384da629c	t	2026-05-03 10:57:18.043327+00	2026-05-03 10:57:18.043327+00
3	4	3	Reviewer	2026-05-03 10:57:31.45137+00		APPROUVÉ	-	8f98127ac05554272a004e2aa4fd26bf06fd0bf3b3eeed0a348dd699b7960d39	t	2026-05-03 10:57:31.45137+00	2026-05-03 10:57:31.45137+00
\.


--
-- Data for Name: versions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.versions (id, document_id, version_letter, file_path, file_name, file_size, mime_type, change_summary, created_at, created_by, sharepoint_link) FROM stdin;
1	2	-	02_PROCESSUS_SUPPORT/Manager_Sante_Securite_Travail/TR0001_Trame_-.pdf	TR0001_Trame_-.pdf	110471	application/pdf	Version initiale	2026-05-01 17:26:19.892033+00	\N	\N
2	2	A	02_PROCESSUS_SUPPORT/Manager_Sante_Securite_Travail/TR0001_Trame_A.pdf	TR0001_Trame_A.pdf	110471	application/pdf	test	2026-05-01 17:28:10.21874+00	2	\N
3	2	A1	02_PROCESSUS_SUPPORT/Manager_Sante_Securite_Travail/TR0001_Trame_A1.pdf	TR0001_Trame_A1.pdf	110471	application/pdf	ttttt	2026-05-01 17:35:09.862233+00	2	\N
4	3	-	02_PROCESSUS_SUPPORT/Manager_Sante_Securite_Travail/PR_Procedures/PR0001_Procedure_-.pdf	PR0001_Procedure_-.pdf	110471	application/pdf	Version initiale	2026-05-01 18:36:27.19572+00	\N	https://mohetn.sharepoint.com/:b:/s/SMQ_GED/IQCw9fXvmCrMT65qsgFIceznAeZplQtudkr6nikDw9WYLKs?e=yb3CNw
5	4	-	01_PROCESSUS_STRATEGIQUE/Fournir_Prestations_Service/TR_Trames/TR0002_Trame_-.pdf	TR0002_Trame_-.pdf	110471	application/pdf	Version initiale	2026-05-01 21:00:59.373113+00	\N	\N
6	5	-	02_PROCESSUS_SUPPORT/Maitriser_Achats_Logistique/PR_Procedures/PR0002_Procedure_-.pdf	PR0002_Procedure_-.pdf	110471	application/pdf	Version initiale	2026-05-01 21:05:15.828924+00	\N	\N
7	6	-	02_PROCESSUS_SUPPORT/Manager_Sante_Securite_Travail/GU_Guides/GU0001_Guide_-.pdf	GU0001_Guide_-.pdf	110471	application/pdf	Version initiale	2026-05-01 21:09:16.440759+00	\N	\N
9	8	-	01_PROCESSUS_STRATEGIQUE/Gerer_Infrastructure_Environnement_Travail/GU_Guides/GU0002_Guide_-.pdf	GU0002_Guide_-.pdf	110471	application/pdf	Version initiale	2026-05-03 09:56:59.916292+00	\N	\N
10	7	A	01_PROCESSUS_STRATEGIQUE/Fournir_Prestations_Service/TR_Trames/TR0003_Trame_A.pdf	TR0003_Trame_A.pdf	110471	application/pdf	ttesstt	2026-05-03 09:58:02.250825+00	2	https://mohetn.sharepoint.com/:b:/s/SMQ_GED/IQCw9fXvmCrMT65qsgFIceznAeZplQtudkr6nikDw9WYLKs?e=p0Qkuc
8	7	-	01_PROCESSUS_STRATEGIQUE/Fournir_Prestations_Service/TR_Trames/TR0003_Trame_-.pdf	TR0003_Trame_-.pdf	110471	application/pdf	Version initiale	2026-05-02 10:29:31.701291+00	\N	https://mohetn.sharepoint.com/:b:/s/SMQ_GED/IQCw9fXvmCrMT65qsgFIceznAeZplQtudkr6nikDw9WYLKs?e=p0Qkuc
11	8	A	01_PROCESSUS_STRATEGIQUE/Gerer_Infrastructure_Environnement_Travail/GU_Guides/GU0002_Guide_A.pdf	GU0002_Guide_A.pdf	110471	application/pdf	tt	2026-05-03 10:07:47.188957+00	2	\N
12	7	A1	01_PROCESSUS_STRATEGIQUE/Fournir_Prestations_Service/TR_Trames/TR0003_Trame_A1.pdf	TR0003_Trame_A1.pdf	110471	application/pdf	test	2026-05-04 08:12:28.099569+00	2	\N
13	9	-	02_PROCESSUS_SUPPORT/Manager_Motiver_Ressources/TR_Trames/TR0004_Trame_-.pdf	TR0004_Trame_-.pdf	110471	application/pdf	Version initiale	2026-05-06 09:47:03.511795+00	\N	\N
14	9	A	02_PROCESSUS_SUPPORT/Manager_Motiver_Ressources/TR_Trames/TR0004_Trame_A.pdf	TR0004_Trame_A.pdf	110471	application/pdf	test version	2026-05-06 09:47:43.411161+00	1	\N
15	7	A2	01_PROCESSUS_STRATEGIQUE/Fournir_Prestations_Service/TR_Trames/TR0003_Trame_A2.pdf	TR0003_Trame_A2.pdf	110471	application/pdf	tett	2026-05-06 13:40:43.369863+00	1	\N
16	10	-	02_PROCESSUS_SUPPORT/Piloter_l_Entreprise/GU_Guides/GU0003_Guide_-.pdf	GU0003_Guide_-.pdf	110471	application/pdf	Version initiale	2026-05-06 14:19:05.111441+00	\N	\N
17	10	A	02_PROCESSUS_SUPPORT/Piloter_l_Entreprise/GU_Guides/GU0003_Guide_A.pdf	GU0003_Guide_A.pdf	110471	application/pdf	te	2026-05-06 14:33:19.2701+00	2	\N
18	11	-	01_PROCESSUS_STRATEGIQUE/Fournir_Prestations_Service/MA_Manuel/MN0001_Manuel_-.pdf	MN0001_Manuel_-.pdf	110471	application/pdf	Version initiale	2026-05-08 14:32:00.035322+00	\N	https://mohetn.sharepoint.com/:b:/s/SMQ_GED/IQCw9fXvmCrMT65qsgFIceznAeZplQtudkr6nikDw9WYLKs?e=Gw5JIR
19	11	A	01_PROCESSUS_STRATEGIQUE/Fournir_Prestations_Service/MA_Manuel/MN0001_Manuel_A.pdf	MN0001_Manuel_A.pdf	110471	application/pdf	vvvvv	2026-05-08 14:50:40.842712+00	2	https://mohetn.sharepoint.com/:b:/s/SMQ_GED/IQCw9fXvmCrMT65qsgFIceznAeZplQtudkr6nikDw9WYLKs?e=5Zymj6
20	12	-	02_PROCESSUS_SUPPORT/Piloter_l_Entreprise/TR_Trames/TR0005_Trame_-.pdf	TR0005_Trame_-.pdf	110471	application/pdf	Version initiale	2026-05-08 15:09:16.017493+00	\N	https://mohetn.sharepoint.com/:b:/s/SMQ_GED/IQCw9fXvmCrMT65qsgFIceznAeZplQtudkr6nikDw9WYLKs?e=ENuUZw
\.


--
-- Name: document_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.document_types_id_seq', 10, true);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.documents_id_seq', 12, true);


--
-- Name: folders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.folders_id_seq', 464, true);


--
-- Name: logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.logs_id_seq', 141, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 78, true);


--
-- Name: processes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.processes_id_seq', 16, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- Name: status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.status_id_seq', 194, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 20, true);


--
-- Name: validations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.validations_id_seq', 3, true);


--
-- Name: versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.versions_id_seq', 20, true);


--
-- PostgreSQL database dump complete
--

\unrestrict G2xMOQUYpaItXmDBM36fIk482JtvA3UDZvryFrzrHG2bH1WJ0u4FQvHudjnPvgg

-- Reset
SET session_replication_role = DEFAULT;
