--
-- PostgreSQL database dump
--

\restrict lCNE215EvGYbVSdrn47LPPZhlc2XtF4kUlw4s4wDJVA2hZH37xm03lQaMeYwl2o

-- Dumped from database version 17.8 (a48d9ca)
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO neondb_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: neondb_owner
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Area; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Area" (
    id integer NOT NULL,
    name text NOT NULL,
    "cityId" integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Area" OWNER TO neondb_owner;

--
-- Name: Area_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."Area_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Area_id_seq" OWNER TO neondb_owner;

--
-- Name: Area_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."Area_id_seq" OWNED BY public."Area".id;


--
-- Name: Brand; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Brand" (
    id integer NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Brand" OWNER TO neondb_owner;

--
-- Name: Brand_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."Brand_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Brand_id_seq" OWNER TO neondb_owner;

--
-- Name: Brand_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."Brand_id_seq" OWNED BY public."Brand".id;


--
-- Name: Call; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Call" (
    id integer NOT NULL,
    problem text NOT NULL,
    category text NOT NULL,
    status text NOT NULL,
    "assignedTo" text,
    "assignedAt" timestamp(3) without time zone,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedBy" text,
    "completedAt" timestamp(3) without time zone,
    "customerId" integer,
    address text,
    "customerName" text NOT NULL,
    email text,
    phone text NOT NULL,
    remark text,
    "engineerRemark" text,
    "assignedBy" text,
    "callCount" integer DEFAULT 1 NOT NULL,
    "lastCalledAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "visitedAt" timestamp(3) without time zone,
    "visitedBy" text,
    "visitedRemark" text,
    "dcCompletedAt" timestamp(3) without time zone,
    "dcCompletedBy" text,
    "dcRemark" text,
    "dcRequired" boolean DEFAULT false NOT NULL,
    "dcStatus" text
);


ALTER TABLE public."Call" OWNER TO neondb_owner;

--
-- Name: Call_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."Call_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Call_id_seq" OWNER TO neondb_owner;

--
-- Name: Call_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."Call_id_seq" OWNED BY public."Call".id;


--
-- Name: CarryInService; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."CarryInService" (
    id integer NOT NULL,
    "customerName" text NOT NULL,
    phone text NOT NULL,
    email text,
    address text,
    category text NOT NULL,
    "serviceDescription" text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "customerId" integer,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedBy" text,
    "completedAt" timestamp(3) without time zone,
    "completeRemark" text,
    "deliveredBy" text,
    "deliveredAt" timestamp(3) without time zone,
    "deliverRemark" text,
    "checkRemark" text,
    "checkedAt" timestamp(3) without time zone,
    "checkedBy" text
);


ALTER TABLE public."CarryInService" OWNER TO neondb_owner;

--
-- Name: CarryInService_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."CarryInService_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."CarryInService_id_seq" OWNER TO neondb_owner;

--
-- Name: CarryInService_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."CarryInService_id_seq" OWNED BY public."CarryInService".id;


--
-- Name: Category; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Category" (
    id integer NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Category" OWNER TO neondb_owner;

--
-- Name: Category_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."Category_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Category_id_seq" OWNER TO neondb_owner;

--
-- Name: Category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."Category_id_seq" OWNED BY public."Category".id;


--
-- Name: City; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."City" (
    id integer NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."City" OWNER TO neondb_owner;

--
-- Name: City_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."City_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."City_id_seq" OWNER TO neondb_owner;

--
-- Name: City_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."City_id_seq" OWNED BY public."City".id;


--
-- Name: Customer; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Customer" (
    id integer NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    address text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "outsideCalls" integer DEFAULT 0 NOT NULL,
    "carryInServices" integer DEFAULT 0 NOT NULL,
    "totalInteractions" integer DEFAULT 0 NOT NULL,
    "lastCallDate" timestamp(3) without time zone,
    "lastServiceDate" timestamp(3) without time zone,
    "lastActivityDate" timestamp(3) without time zone
);


ALTER TABLE public."Customer" OWNER TO neondb_owner;

--
-- Name: Customer_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."Customer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Customer_id_seq" OWNER TO neondb_owner;

--
-- Name: Customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."Customer_id_seq" OWNED BY public."Customer".id;


--
-- Name: DeletionHistory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."DeletionHistory" (
    id integer NOT NULL,
    "deletedBy" integer NOT NULL,
    "deletedByName" text NOT NULL,
    "deletedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "callCount" integer NOT NULL
);


ALTER TABLE public."DeletionHistory" OWNER TO neondb_owner;

--
-- Name: DeletionHistory_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."DeletionHistory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DeletionHistory_id_seq" OWNER TO neondb_owner;

--
-- Name: DeletionHistory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."DeletionHistory_id_seq" OWNED BY public."DeletionHistory".id;


--
-- Name: Location; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Location" (
    id integer NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Location" OWNER TO neondb_owner;

--
-- Name: Location_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."Location_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Location_id_seq" OWNER TO neondb_owner;

--
-- Name: Location_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."Location_id_seq" OWNED BY public."Location".id;


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Notification" (
    id integer NOT NULL,
    "userId" text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "callId" integer
);


ALTER TABLE public."Notification" OWNER TO neondb_owner;

--
-- Name: Notification_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."Notification_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Notification_id_seq" OWNER TO neondb_owner;

--
-- Name: Notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."Notification_id_seq" OWNED BY public."Notification".id;


--
-- Name: Order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Order" (
    id integer NOT NULL,
    "salesEntryId" integer NOT NULL,
    "orderRemark" text NOT NULL,
    "calledBy" character varying(50),
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdBy" character varying(50) NOT NULL,
    "createdById" integer,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "billingRemark" text,
    "billedBy" character varying(50),
    "billedAt" timestamp(6) with time zone,
    "completionRemark" text,
    "completedBy" character varying(50),
    "completedAt" timestamp(6) with time zone,
    "cancelledBy" character varying(50),
    "cancelledAt" timestamp(6) with time zone,
    "dispatchFrom" character varying(50),
    "revertRemark" text,
    "brandName" character varying(100) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public."Order" OWNER TO neondb_owner;

--
-- Name: OrderHold; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."OrderHold" (
    id integer NOT NULL,
    "orderId" integer NOT NULL,
    remark text NOT NULL,
    "heldBy" character varying(50) NOT NULL,
    "heldById" integer,
    "heldAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OrderHold" OWNER TO neondb_owner;

--
-- Name: OrderHold_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."OrderHold_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."OrderHold_id_seq" OWNER TO neondb_owner;

--
-- Name: OrderHold_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."OrderHold_id_seq" OWNED BY public."OrderHold".id;


--
-- Name: Order_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."Order_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Order_id_seq" OWNER TO neondb_owner;

--
-- Name: Order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."Order_id_seq" OWNED BY public."Order".id;


--
-- Name: OtpToken; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."OtpToken" (
    id integer NOT NULL,
    email text NOT NULL,
    otp text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OtpToken" OWNER TO neondb_owner;

--
-- Name: OtpToken_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."OtpToken_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."OtpToken_id_seq" OWNER TO neondb_owner;

--
-- Name: OtpToken_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."OtpToken_id_seq" OWNED BY public."OtpToken".id;


--
-- Name: PublicAccessToken; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."PublicAccessToken" (
    id integer NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PublicAccessToken" OWNER TO neondb_owner;

--
-- Name: PublicAccessToken_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."PublicAccessToken_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PublicAccessToken_id_seq" OWNER TO neondb_owner;

--
-- Name: PublicAccessToken_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."PublicAccessToken_id_seq" OWNED BY public."PublicAccessToken".id;


--
-- Name: SalesEntry; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."SalesEntry" (
    id integer NOT NULL,
    "firmName" character varying(255) NOT NULL,
    "gstNo" character varying(15) NOT NULL,
    "contactPerson1Name" character varying(100) NOT NULL,
    "contactPerson1Number" character varying(15) NOT NULL,
    "contactPerson2Name" character varying(100),
    "contactPerson2Number" character varying(15),
    "accountContactName" character varying(100),
    "accountContactNumber" character varying(15),
    address character varying(500) NOT NULL,
    landmark character varying(200),
    pincode character varying(6) NOT NULL,
    email character varying(255),
    "createdBy" character varying(50) NOT NULL,
    "createdById" integer,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL,
    "delayCount" integer DEFAULT 0 NOT NULL,
    "delayedBy" text[] DEFAULT ARRAY[]::text[],
    "lastActivityDate" timestamp(6) with time zone,
    "reminderDate" timestamp(6) with time zone,
    area character varying(100),
    city character varying(100) NOT NULL,
    "whatsappNumber" character varying(15)
);


ALTER TABLE public."SalesEntry" OWNER TO neondb_owner;

--
-- Name: SalesEntry_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."SalesEntry_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SalesEntry_id_seq" OWNER TO neondb_owner;

--
-- Name: SalesEntry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."SalesEntry_id_seq" OWNED BY public."SalesEntry".id;


--
-- Name: SalesLog; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."SalesLog" (
    id integer NOT NULL,
    "salesEntryId" integer NOT NULL,
    "logType" character varying(10) NOT NULL,
    "callType" character varying(10),
    remark text,
    "loggedBy" character varying(50) NOT NULL,
    "loggedById" integer,
    "loggedAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    latitude double precision,
    "locationAccuracy" double precision,
    longitude double precision
);


ALTER TABLE public."SalesLog" OWNER TO neondb_owner;

--
-- Name: SalesLog_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."SalesLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SalesLog_id_seq" OWNER TO neondb_owner;

--
-- Name: SalesLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."SalesLog_id_seq" OWNED BY public."SalesLog".id;


--
-- Name: ServiceCategory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ServiceCategory" (
    id integer NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ServiceCategory" OWNER TO neondb_owner;

--
-- Name: ServiceCategory_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."ServiceCategory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ServiceCategory_id_seq" OWNER TO neondb_owner;

--
-- Name: ServiceCategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."ServiceCategory_id_seq" OWNED BY public."ServiceCategory".id;


--
-- Name: ServiceDeletionHistory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ServiceDeletionHistory" (
    id integer NOT NULL,
    "deletedBy" integer NOT NULL,
    "deletedByName" text NOT NULL,
    "deletedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "serviceCount" integer NOT NULL
);


ALTER TABLE public."ServiceDeletionHistory" OWNER TO neondb_owner;

--
-- Name: ServiceDeletionHistory_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."ServiceDeletionHistory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ServiceDeletionHistory_id_seq" OWNER TO neondb_owner;

--
-- Name: ServiceDeletionHistory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."ServiceDeletionHistory_id_seq" OWNED BY public."ServiceDeletionHistory".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role text NOT NULL,
    "secretPassword" text DEFAULT 'DEFAULTSECRET'::text NOT NULL,
    "brandName" character varying(100)
);


ALTER TABLE public."User" OWNER TO neondb_owner;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO neondb_owner;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: Area id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Area" ALTER COLUMN id SET DEFAULT nextval('public."Area_id_seq"'::regclass);


--
-- Name: Brand id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Brand" ALTER COLUMN id SET DEFAULT nextval('public."Brand_id_seq"'::regclass);


--
-- Name: Call id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Call" ALTER COLUMN id SET DEFAULT nextval('public."Call_id_seq"'::regclass);


--
-- Name: CarryInService id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CarryInService" ALTER COLUMN id SET DEFAULT nextval('public."CarryInService_id_seq"'::regclass);


--
-- Name: Category id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Category" ALTER COLUMN id SET DEFAULT nextval('public."Category_id_seq"'::regclass);


--
-- Name: City id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."City" ALTER COLUMN id SET DEFAULT nextval('public."City_id_seq"'::regclass);


--
-- Name: Customer id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Customer" ALTER COLUMN id SET DEFAULT nextval('public."Customer_id_seq"'::regclass);


--
-- Name: DeletionHistory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."DeletionHistory" ALTER COLUMN id SET DEFAULT nextval('public."DeletionHistory_id_seq"'::regclass);


--
-- Name: Location id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Location" ALTER COLUMN id SET DEFAULT nextval('public."Location_id_seq"'::regclass);


--
-- Name: Notification id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Notification" ALTER COLUMN id SET DEFAULT nextval('public."Notification_id_seq"'::regclass);


--
-- Name: Order id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order" ALTER COLUMN id SET DEFAULT nextval('public."Order_id_seq"'::regclass);


--
-- Name: OrderHold id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderHold" ALTER COLUMN id SET DEFAULT nextval('public."OrderHold_id_seq"'::regclass);


--
-- Name: OtpToken id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OtpToken" ALTER COLUMN id SET DEFAULT nextval('public."OtpToken_id_seq"'::regclass);


--
-- Name: PublicAccessToken id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PublicAccessToken" ALTER COLUMN id SET DEFAULT nextval('public."PublicAccessToken_id_seq"'::regclass);


--
-- Name: SalesEntry id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SalesEntry" ALTER COLUMN id SET DEFAULT nextval('public."SalesEntry_id_seq"'::regclass);


--
-- Name: SalesLog id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SalesLog" ALTER COLUMN id SET DEFAULT nextval('public."SalesLog_id_seq"'::regclass);


--
-- Name: ServiceCategory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ServiceCategory" ALTER COLUMN id SET DEFAULT nextval('public."ServiceCategory_id_seq"'::regclass);


--
-- Name: ServiceDeletionHistory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ServiceDeletionHistory" ALTER COLUMN id SET DEFAULT nextval('public."ServiceDeletionHistory_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: Area; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Area" (id, name, "cityId", "isActive", "createdAt", "updatedAt") FROM stdin;
1	vaikunth dham	1	t	2026-03-13 10:41:24.885	2026-03-13 10:41:24.885
2	shivkrupa	1	t	2026-03-13 10:50:23.157	2026-03-13 10:50:23.157
3	baloj complex	1	t	2026-03-13 18:18:49.284	2026-03-13 18:18:49.284
4	Rayasan	112	t	2026-03-14 19:10:44.092	2026-03-14 19:10:44.092
5	80 ft. ring road	1	t	2026-03-18 18:14:00.848	2026-03-18 18:14:00.848
6	DIAMONG CHOKDI	1	t	2026-03-18 18:30:42.037	2026-03-18 18:30:42.037
7	a1	8	t	2026-03-18 18:36:10.975	2026-03-18 18:36:10.975
\.


--
-- Data for Name: Brand; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Brand" (id, name, "isActive", "createdAt", "updatedAt") FROM stdin;
1	HP	t	2026-04-12 10:36:57.928	2026-04-12 10:36:57.928
3	Fingers	t	2026-04-12 10:37:22.145	2026-04-12 10:37:22.145
2	Dell1	f	2026-04-12 10:37:09.428	2026-04-12 10:46:26.204
\.


--
-- Data for Name: Call; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Call" (id, problem, category, status, "assignedTo", "assignedAt", "createdBy", "createdAt", "completedBy", "completedAt", "customerId", address, "customerName", email, phone, remark, "engineerRemark", "assignedBy", "callCount", "lastCalledAt", "visitedAt", "visitedBy", "visitedRemark", "dcCompletedAt", "dcCompletedBy", "dcRemark", "dcRequired", "dcStatus") FROM stdin;
1	pd	call	VISITED	\N	\N	host	2026-03-12 18:11:17.128	\N	\N	1	vaikunth sham	joy	joypatel1509@gmail.com	1231231231	\N	\N	\N	1	2026-03-12 18:11:17.128	2026-03-12 18:11:41.604	host	host (12 Mar, 11:41 pm): v1	\N	\N	\N	f	\N
2	cfvghbkjlnm	insa	ASSIGNED	admin	2026-03-21 05:50:36.732	host	2026-03-21 05:50:36.74	\N	\N	2	xcfhjb	shruti patel	shrutipatel0308@gmail.com	8799157041	\N	hello	host	1	2026-03-21 05:50:36.74	\N	\N	\N	\N	\N	\N	f	\N
3	pddd	insa	ASSIGNED	eng	2026-04-11 05:55:21.32	host	2026-04-11 05:55:21.324	\N	\N	2	xcfhjb	shruti patel	shrutipatel0308@gmail.com	8799157041	\N	iiiiii	host	1	2026-04-11 05:55:21.324	\N	\N	\N	\N	\N	\N	f	\N
4	pf	call	ASSIGNED	admin	2026-04-11 05:59:04.273	host	2026-04-11 05:59:04.276	\N	\N	4	Vaikunth Dham near Gokuldham\nVisnagar Road, Unjha	joy	joypatel1595@gmail.com	9265900554	\N	eewwwwww	host	1	2026-04-11 05:59:04.276	\N	\N	\N	\N	\N	\N	f	\N
\.


--
-- Data for Name: CarryInService; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."CarryInService" (id, "customerName", phone, email, address, category, "serviceDescription", status, "customerId", "createdBy", "createdAt", "completedBy", "completedAt", "completeRemark", "deliveredBy", "deliveredAt", "deliverRemark", "checkRemark", "checkedAt", "checkedBy") FROM stdin;
1	shruti patel	8799157041	shrutipatel0308@gmail.com	xcfhjb	printer	retxrcyvuibnm	COMPLETED_AND_COLLECTED	2	host	2026-03-21 05:57:11.463	host	2026-03-21 18:08:23.331	\N	host	2026-03-21 18:08:29	\N	\N	\N	\N
2	Shital	9898183378	\N	shivkrupa	laptop	itxychv 	PENDING	3	host	2026-03-21 18:08:36.75	\N	\N	\N	\N	\N	\N	\N	\N	\N
3	Shital	9898183378	\N	shivkrupa	printer	zdxfhjgkh	PENDING	3	host	2026-04-12 17:00:12.143	\N	\N	\N	\N	\N	\N	host (12 Apr, 11:10 pm): check1\nhost (12 Apr, 11:10 pm): check2	2026-04-12 17:40:26.09	host
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Category" (id, name, "isActive", "createdAt", "updatedAt") FROM stdin;
1	insa	t	2026-03-12 18:10:58.108	2026-03-12 18:10:58.108
2	call	t	2026-03-12 18:11:01.668	2026-03-12 18:11:01.668
\.


--
-- Data for Name: City; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."City" (id, name, "isActive", "createdAt", "updatedAt") FROM stdin;
1	Unjha	t	2026-03-13 10:40:16.225	2026-03-13 10:55:27.402
4	mehsana	t	2026-03-13 10:48:18.822	2026-03-13 10:48:18.822
5	Adalaj	t	2026-03-13 10:54:52.989	2026-03-13 10:54:52.989
6	Ahmedabad	t	2026-03-13 10:54:53.235	2026-03-13 10:54:53.235
7	Ahmedabad Cantonment	t	2026-03-13 10:54:53.359	2026-03-13 10:54:53.359
8	Ahwa	t	2026-03-13 10:54:53.48	2026-03-13 10:54:53.48
9	Alang	t	2026-03-13 10:54:53.61	2026-03-13 10:54:53.61
10	Alang-Sosiya	t	2026-03-13 10:54:53.736	2026-03-13 10:54:53.736
11	Alikherva	t	2026-03-13 10:54:53.861	2026-03-13 10:54:53.861
12	Amardad	t	2026-03-13 10:54:53.97	2026-03-13 10:54:53.97
13	Ambaji	t	2026-03-13 10:54:54.098	2026-03-13 10:54:54.098
14	Ambaliyasan	t	2026-03-13 10:54:54.234	2026-03-13 10:54:54.234
15	Amboli	t	2026-03-13 10:54:54.353	2026-03-13 10:54:54.353
16	Amod	t	2026-03-13 10:54:54.476	2026-03-13 10:54:54.476
17	Amreli	t	2026-03-13 10:54:54.602	2026-03-13 10:54:54.602
18	Anand	t	2026-03-13 10:54:54.722	2026-03-13 10:54:54.722
19	Anandpar	t	2026-03-13 10:54:54.83	2026-03-13 10:54:54.83
20	Andada	t	2026-03-13 10:54:54.951	2026-03-13 10:54:54.951
21	Anjar	t	2026-03-13 10:54:55.071	2026-03-13 10:54:55.071
22	Anklav	t	2026-03-13 10:54:55.199	2026-03-13 10:54:55.199
23	Ankleshwar	t	2026-03-13 10:54:55.327	2026-03-13 10:54:55.327
24	Antaliya	t	2026-03-13 10:54:55.459	2026-03-13 10:54:55.459
25	Antarjal	t	2026-03-13 10:54:55.576	2026-03-13 10:54:55.576
26	Arsodiya	t	2026-03-13 10:54:55.705	2026-03-13 10:54:55.705
27	Atul	t	2026-03-13 10:54:55.82	2026-03-13 10:54:55.82
28	Baben	t	2026-03-13 10:54:55.949	2026-03-13 10:54:55.949
29	Babra	t	2026-03-13 10:54:56.067	2026-03-13 10:54:56.067
30	Bagasara	t	2026-03-13 10:54:56.175	2026-03-13 10:54:56.175
31	Bajwa	t	2026-03-13 10:54:56.303	2026-03-13 10:54:56.303
32	Balasinor	t	2026-03-13 10:54:56.419	2026-03-13 10:54:56.419
33	Balitha	t	2026-03-13 10:54:56.551	2026-03-13 10:54:56.551
34	Baliyasan	t	2026-03-13 10:54:56.678	2026-03-13 10:54:56.678
35	Bansda	t	2026-03-13 10:54:56.802	2026-03-13 10:54:56.802
36	Bantva	t	2026-03-13 10:54:56.934	2026-03-13 10:54:56.934
37	Bardoli	t	2026-03-13 10:54:57.042	2026-03-13 10:54:57.042
38	Bareja	t	2026-03-13 10:54:57.17	2026-03-13 10:54:57.17
39	Barwala	t	2026-03-13 10:54:57.301	2026-03-13 10:54:57.301
40	Bavla	t	2026-03-13 10:54:57.428	2026-03-13 10:54:57.428
41	Bayad	t	2026-03-13 10:54:57.556	2026-03-13 10:54:57.556
42	Becharaji	t	2026-03-13 10:54:57.675	2026-03-13 10:54:57.675
43	Bhabhar	t	2026-03-13 10:54:57.797	2026-03-13 10:54:57.797
44	Bhachau	t	2026-03-13 10:54:57.916	2026-03-13 10:54:57.916
45	Bhadkodara	t	2026-03-13 10:54:58.045	2026-03-13 10:54:58.045
46	Bhagal	t	2026-03-13 10:54:58.17	2026-03-13 10:54:58.17
47	Bhagdawada	t	2026-03-13 10:54:58.328	2026-03-13 10:54:58.328
48	Bhalpara	t	2026-03-13 10:54:58.445	2026-03-13 10:54:58.445
49	Bhanvad	t	2026-03-13 10:54:58.597	2026-03-13 10:54:58.597
50	Bharthana Kosad	t	2026-03-13 10:54:58.716	2026-03-13 10:54:58.716
51	Bharuch	t	2026-03-13 10:54:59.034	2026-03-13 10:54:59.034
52	Bhat	t	2026-03-13 10:54:59.166	2026-03-13 10:54:59.166
53	Bhavnagar	t	2026-03-13 10:54:59.289	2026-03-13 10:54:59.289
54	Bhayavadar	t	2026-03-13 10:54:59.42	2026-03-13 10:54:59.42
55	Bhilad	t	2026-03-13 10:54:59.538	2026-03-13 10:54:59.538
56	Bhiloda	t	2026-03-13 10:54:59.673	2026-03-13 10:54:59.673
57	Bholav	t	2026-03-13 10:54:59.806	2026-03-13 10:54:59.806
58	Bhuj	t	2026-03-13 10:54:59.932	2026-03-13 10:54:59.932
59	Bhurivel	t	2026-03-13 10:55:00.158	2026-03-13 10:55:00.158
60	Bilimora	t	2026-03-13 10:55:00.293	2026-03-13 10:55:00.293
61	Bodeli	t	2026-03-13 10:55:00.563	2026-03-13 10:55:00.563
62	Bopal	t	2026-03-13 10:55:00.696	2026-03-13 10:55:00.696
63	Boriavi	t	2026-03-13 10:55:00.877	2026-03-13 10:55:00.877
64	Borsad	t	2026-03-13 10:55:00.999	2026-03-13 10:55:00.999
65	Botad	t	2026-03-13 10:55:01.144	2026-03-13 10:55:01.144
66	Chaklasi	t	2026-03-13 10:55:01.283	2026-03-13 10:55:01.283
67	Chalala	t	2026-03-13 10:55:01.412	2026-03-13 10:55:01.412
68	Chalthan	t	2026-03-13 10:55:01.529	2026-03-13 10:55:01.529
69	Chanasma	t	2026-03-13 10:55:01.747	2026-03-13 10:55:01.747
70	Chandrapur	t	2026-03-13 10:55:01.986	2026-03-13 10:55:01.986
71	Chanod	t	2026-03-13 10:55:02.259	2026-03-13 10:55:02.259
72	Chhapi	t	2026-03-13 10:55:02.396	2026-03-13 10:55:02.396
73	Chhapra	t	2026-03-13 10:55:02.615	2026-03-13 10:55:02.615
74	Chhatral	t	2026-03-13 10:55:02.768	2026-03-13 10:55:02.768
75	Chhaya	t	2026-03-13 10:55:03.006	2026-03-13 10:55:03.006
76	Chhiri	t	2026-03-13 10:55:03.129	2026-03-13 10:55:03.129
77	Chhota Udaipur	t	2026-03-13 10:55:04.502	2026-03-13 10:55:04.502
78	Chikhli	t	2026-03-13 10:55:04.62	2026-03-13 10:55:04.62
79	Chiloda	t	2026-03-13 10:55:04.747	2026-03-13 10:55:04.747
80	Chorvad	t	2026-03-13 10:55:04.867	2026-03-13 10:55:04.867
81	Chotila	t	2026-03-13 10:55:04.998	2026-03-13 10:55:04.998
82	Dabhoi	t	2026-03-13 10:55:05.121	2026-03-13 10:55:05.121
83	Daheli	t	2026-03-13 10:55:05.25	2026-03-13 10:55:05.25
84	Dakor	t	2026-03-13 10:55:05.378	2026-03-13 10:55:05.378
85	Damnagar	t	2026-03-13 10:55:05.51	2026-03-13 10:55:05.51
86	Dediapada	t	2026-03-13 10:55:05.637	2026-03-13 10:55:05.637
87	Deesa	t	2026-03-13 10:55:05.76	2026-03-13 10:55:05.76
88	Dehari	t	2026-03-13 10:55:05.887	2026-03-13 10:55:05.887
89	Dehgam	t	2026-03-13 10:55:06.016	2026-03-13 10:55:06.016
90	Deodar	t	2026-03-13 10:55:06.15	2026-03-13 10:55:06.15
91	Devgadh Baria	t	2026-03-13 10:55:06.261	2026-03-13 10:55:06.261
92	Devsar	t	2026-03-13 10:55:06.372	2026-03-13 10:55:06.372
93	Dhandhuka	t	2026-03-13 10:55:06.494	2026-03-13 10:55:06.494
94	Dhanera	t	2026-03-13 10:55:06.622	2026-03-13 10:55:06.622
95	Dharampur	t	2026-03-13 10:55:06.746	2026-03-13 10:55:06.746
96	Dhasa	t	2026-03-13 10:55:06.866	2026-03-13 10:55:06.866
97	Dhola	t	2026-03-13 10:55:06.978	2026-03-13 10:55:06.978
98	Dholka	t	2026-03-13 10:55:07.117	2026-03-13 10:55:07.117
99	Dhoraji	t	2026-03-13 10:55:07.236	2026-03-13 10:55:07.236
100	Dhrangadhra	t	2026-03-13 10:55:07.349	2026-03-13 10:55:07.349
101	Dhrol	t	2026-03-13 10:55:07.483	2026-03-13 10:55:07.483
102	Digvijaygram	t	2026-03-13 10:55:07.604	2026-03-13 10:55:07.604
103	Dahod	t	2026-03-13 10:55:07.715	2026-03-13 10:55:07.715
104	Dwarka	t	2026-03-13 10:55:07.836	2026-03-13 10:55:07.836
105	Freelandgunj	t	2026-03-13 10:55:07.96	2026-03-13 10:55:07.96
106	Gadhada	t	2026-03-13 10:55:08.09	2026-03-13 10:55:08.09
107	Gadkhol	t	2026-03-13 10:55:08.201	2026-03-13 10:55:08.201
108	Galpadar	t	2026-03-13 10:55:08.385	2026-03-13 10:55:08.385
109	Gamdi	t	2026-03-13 10:55:08.511	2026-03-13 10:55:08.511
110	Gandevi	t	2026-03-13 10:55:08.633	2026-03-13 10:55:08.633
111	Gandhidham	t	2026-03-13 10:55:08.774	2026-03-13 10:55:08.774
112	Gandhinagar	t	2026-03-13 10:55:08.909	2026-03-13 10:55:08.909
113	Gariadhar	t	2026-03-13 10:55:09.041	2026-03-13 10:55:09.041
114	Ghanteshvar	t	2026-03-13 10:55:09.176	2026-03-13 10:55:09.176
115	Ghogha	t	2026-03-13 10:55:09.29	2026-03-13 10:55:09.29
116	Godhra	t	2026-03-13 10:55:09.412	2026-03-13 10:55:09.412
117	Gondal	t	2026-03-13 10:55:09.54	2026-03-13 10:55:09.54
118	Halol	t	2026-03-13 10:55:09.67	2026-03-13 10:55:09.67
119	Halvad	t	2026-03-13 10:55:09.798	2026-03-13 10:55:09.798
120	Harij	t	2026-03-13 10:55:10.028	2026-03-13 10:55:10.028
121	Himatnagar	t	2026-03-13 10:55:10.177	2026-03-13 10:55:10.177
122	Ichchhapor	t	2026-03-13 10:55:10.396	2026-03-13 10:55:10.396
123	Idar	t	2026-03-13 10:55:10.524	2026-03-13 10:55:10.524
124	Jafrabad	t	2026-03-13 10:55:10.641	2026-03-13 10:55:10.641
125	Jambusar	t	2026-03-13 10:55:10.766	2026-03-13 10:55:10.766
126	Jamjodhpur	t	2026-03-13 10:55:10.882	2026-03-13 10:55:10.882
127	Jamnagar	t	2026-03-13 10:55:11.055	2026-03-13 10:55:11.055
128	Jasdan	t	2026-03-13 10:55:11.176	2026-03-13 10:55:11.176
129	Jetpur	t	2026-03-13 10:55:11.296	2026-03-13 10:55:11.296
130	Jetpur Navagadh	t	2026-03-13 10:55:11.439	2026-03-13 10:55:11.439
131	Jhadeshwar	t	2026-03-13 10:55:11.616	2026-03-13 10:55:11.616
132	Jhalod	t	2026-03-13 10:55:11.745	2026-03-13 10:55:11.745
133	Junagadh	t	2026-03-13 10:55:11.864	2026-03-13 10:55:11.864
134	Kabilpor	t	2026-03-13 10:55:12.007	2026-03-13 10:55:12.007
135	Kadi	t	2026-03-13 10:55:12.179	2026-03-13 10:55:12.179
136	Kadodara	t	2026-03-13 10:55:12.398	2026-03-13 10:55:12.398
137	Kalavad	t	2026-03-13 10:55:12.529	2026-03-13 10:55:12.529
138	Kalol	t	2026-03-13 10:55:12.674	2026-03-13 10:55:12.674
139	Kandla	t	2026-03-13 10:55:12.817	2026-03-13 10:55:12.817
140	Kanjari	t	2026-03-13 10:55:13.076	2026-03-13 10:55:13.076
141	Kanodar	t	2026-03-13 10:55:13.432	2026-03-13 10:55:13.432
142	Kapadvanj	t	2026-03-13 10:55:13.565	2026-03-13 10:55:13.565
143	Karamsad	t	2026-03-13 10:55:13.691	2026-03-13 10:55:13.691
144	Karjan	t	2026-03-13 10:55:13.81	2026-03-13 10:55:13.81
145	Kathlal	t	2026-03-13 10:55:13.93	2026-03-13 10:55:13.93
146	Katpar	t	2026-03-13 10:55:14.064	2026-03-13 10:55:14.064
147	Kavant	t	2026-03-13 10:55:14.186	2026-03-13 10:55:14.186
148	Keshod	t	2026-03-13 10:55:14.309	2026-03-13 10:55:14.309
149	Kevadiya	t	2026-03-13 10:55:14.426	2026-03-13 10:55:14.426
150	Khambhalia	t	2026-03-13 10:55:14.539	2026-03-13 10:55:14.539
151	Khambhat	t	2026-03-13 10:55:14.656	2026-03-13 10:55:14.656
152	Kharaghoda	t	2026-03-13 10:55:14.776	2026-03-13 10:55:14.776
153	Kheda	t	2026-03-13 10:55:14.954	2026-03-13 10:55:14.954
154	Khedbrahma	t	2026-03-13 10:55:15.071	2026-03-13 10:55:15.071
155	Kheralu	t	2026-03-13 10:55:15.197	2026-03-13 10:55:15.197
156	Kim	t	2026-03-13 10:55:15.325	2026-03-13 10:55:15.325
157	Kodinar	t	2026-03-13 10:55:15.493	2026-03-13 10:55:15.493
158	Kosamba	t	2026-03-13 10:55:15.61	2026-03-13 10:55:15.61
159	Kotharia	t	2026-03-13 10:55:15.732	2026-03-13 10:55:15.732
160	Kutiyana	t	2026-03-13 10:55:15.853	2026-03-13 10:55:15.853
161	Lathi	t	2026-03-13 10:55:16	2026-03-13 10:55:16
162	Lilia	t	2026-03-13 10:55:16.239	2026-03-13 10:55:16.239
163	Limbdi	t	2026-03-13 10:55:16.386	2026-03-13 10:55:16.386
164	Lunawada	t	2026-03-13 10:55:16.628	2026-03-13 10:55:16.628
165	Madhapar	t	2026-03-13 10:55:16.863	2026-03-13 10:55:16.863
166	Mahendranagar	t	2026-03-13 10:55:17.027	2026-03-13 10:55:17.027
167	Mehsana	t	2026-03-13 10:55:17.149	2026-03-13 10:55:17.149
168	Mahudha	t	2026-03-13 10:55:17.294	2026-03-13 10:55:17.294
169	Mahuva	t	2026-03-13 10:55:17.411	2026-03-13 10:55:17.411
170	Maliya	t	2026-03-13 10:55:17.682	2026-03-13 10:55:17.682
171	Malpur	t	2026-03-13 10:55:17.803	2026-03-13 10:55:17.803
172	Manavadar	t	2026-03-13 10:55:17.942	2026-03-13 10:55:17.942
173	Mandvi	t	2026-03-13 10:55:18.156	2026-03-13 10:55:18.156
174	Mangrol	t	2026-03-13 10:55:18.273	2026-03-13 10:55:18.273
175	Mansa	t	2026-03-13 10:55:18.427	2026-03-13 10:55:18.427
176	Meghraj	t	2026-03-13 10:55:18.544	2026-03-13 10:55:18.544
177	Mehmedabad	t	2026-03-13 10:55:18.728	2026-03-13 10:55:18.728
178	Mithapur	t	2026-03-13 10:55:18.892	2026-03-13 10:55:18.892
179	Modasa	t	2026-03-13 10:55:19.01	2026-03-13 10:55:19.01
180	Morbi	t	2026-03-13 10:55:19.181	2026-03-13 10:55:19.181
181	Mundra	t	2026-03-13 10:55:19.365	2026-03-13 10:55:19.365
182	Nadiad	t	2026-03-13 10:55:19.616	2026-03-13 10:55:19.616
183	Nandej	t	2026-03-13 10:55:19.731	2026-03-13 10:55:19.731
184	Nandesari	t	2026-03-13 10:55:19.856	2026-03-13 10:55:19.856
185	Navsari	t	2026-03-13 10:55:19.976	2026-03-13 10:55:19.976
186	Ode	t	2026-03-13 10:55:20.136	2026-03-13 10:55:20.136
187	Okha	t	2026-03-13 10:55:20.281	2026-03-13 10:55:20.281
188	Padra	t	2026-03-13 10:55:20.415	2026-03-13 10:55:20.415
189	Palanpur	t	2026-03-13 10:55:20.537	2026-03-13 10:55:20.537
190	Palej	t	2026-03-13 10:55:20.666	2026-03-13 10:55:20.666
191	Palitana	t	2026-03-13 10:55:20.791	2026-03-13 10:55:20.791
192	Pardi	t	2026-03-13 10:55:20.92	2026-03-13 10:55:20.92
193	Patan	t	2026-03-13 10:55:21.052	2026-03-13 10:55:21.052
194	Patdi	t	2026-03-13 10:55:21.174	2026-03-13 10:55:21.174
195	Pethapur	t	2026-03-13 10:55:21.296	2026-03-13 10:55:21.296
196	Petlad	t	2026-03-13 10:55:21.412	2026-03-13 10:55:21.412
197	Porbandar	t	2026-03-13 10:55:21.543	2026-03-13 10:55:21.543
198	Prantij	t	2026-03-13 10:55:21.786	2026-03-13 10:55:21.786
199	Radhanpur	t	2026-03-13 10:55:21.913	2026-03-13 10:55:21.913
200	Rajkot	t	2026-03-13 10:55:22.04	2026-03-13 10:55:22.04
201	Rajpipla	t	2026-03-13 10:55:22.235	2026-03-13 10:55:22.235
202	Rajula	t	2026-03-13 10:55:22.356	2026-03-13 10:55:22.356
203	Ranavav	t	2026-03-13 10:55:22.484	2026-03-13 10:55:22.484
204	Ranoli	t	2026-03-13 10:55:22.716	2026-03-13 10:55:22.716
205	Ranpur	t	2026-03-13 10:55:22.841	2026-03-13 10:55:22.841
206	Rapar	t	2026-03-13 10:55:22.964	2026-03-13 10:55:22.964
207	Raval	t	2026-03-13 10:55:23.086	2026-03-13 10:55:23.086
208	Sachin	t	2026-03-13 10:55:23.301	2026-03-13 10:55:23.301
209	Sagbara	t	2026-03-13 10:55:23.426	2026-03-13 10:55:23.426
210	Saij	t	2026-03-13 10:55:23.545	2026-03-13 10:55:23.545
211	Salaya	t	2026-03-13 10:55:23.662	2026-03-13 10:55:23.662
212	Sanand	t	2026-03-13 10:55:23.842	2026-03-13 10:55:23.842
213	Sanjan	t	2026-03-13 10:55:23.987	2026-03-13 10:55:23.987
214	Santrampur	t	2026-03-13 10:55:24.186	2026-03-13 10:55:24.186
215	Saputara	t	2026-03-13 10:55:24.316	2026-03-13 10:55:24.316
216	Sarigam	t	2026-03-13 10:55:24.438	2026-03-13 10:55:24.438
217	Savarkundla	t	2026-03-13 10:55:24.556	2026-03-13 10:55:24.556
218	Savli	t	2026-03-13 10:55:24.67	2026-03-13 10:55:24.67
219	Sayan	t	2026-03-13 10:55:24.786	2026-03-13 10:55:24.786
220	Shehera	t	2026-03-13 10:55:24.906	2026-03-13 10:55:24.906
221	Sidhpur	t	2026-03-13 10:55:25.023	2026-03-13 10:55:25.023
222	Sihor	t	2026-03-13 10:55:25.142	2026-03-13 10:55:25.142
223	Sikka	t	2026-03-13 10:55:25.273	2026-03-13 10:55:25.273
224	Sojitra	t	2026-03-13 10:55:25.394	2026-03-13 10:55:25.394
225	Songadh	t	2026-03-13 10:55:25.51	2026-03-13 10:55:25.51
226	Surat	t	2026-03-13 10:55:25.655	2026-03-13 10:55:25.655
227	Surendranagar	t	2026-03-13 10:55:25.769	2026-03-13 10:55:25.769
228	Talaja	t	2026-03-13 10:55:25.896	2026-03-13 10:55:25.896
229	Talala	t	2026-03-13 10:55:26.116	2026-03-13 10:55:26.116
230	Talod	t	2026-03-13 10:55:26.26	2026-03-13 10:55:26.26
231	Thangadh	t	2026-03-13 10:55:26.376	2026-03-13 10:55:26.376
232	Thara	t	2026-03-13 10:55:26.513	2026-03-13 10:55:26.513
233	Tharad	t	2026-03-13 10:55:26.634	2026-03-13 10:55:26.634
234	Thasra	t	2026-03-13 10:55:26.754	2026-03-13 10:55:26.754
235	Ukai	t	2026-03-13 10:55:26.886	2026-03-13 10:55:26.886
236	Umbergaon	t	2026-03-13 10:55:27.01	2026-03-13 10:55:27.01
237	Umreth	t	2026-03-13 10:55:27.16	2026-03-13 10:55:27.16
238	Una	t	2026-03-13 10:55:27.286	2026-03-13 10:55:27.286
240	Upleta	t	2026-03-13 10:55:27.519	2026-03-13 10:55:27.519
241	Vadali	t	2026-03-13 10:55:27.624	2026-03-13 10:55:27.624
242	Vadnagar	t	2026-03-13 10:55:27.757	2026-03-13 10:55:27.757
243	Vadodara	t	2026-03-13 10:55:27.883	2026-03-13 10:55:27.883
244	Valsad	t	2026-03-13 10:55:28.008	2026-03-13 10:55:28.008
245	Vanthali	t	2026-03-13 10:55:28.13	2026-03-13 10:55:28.13
246	Vapi	t	2026-03-13 10:55:28.252	2026-03-13 10:55:28.252
247	Vartej	t	2026-03-13 10:55:28.424	2026-03-13 10:55:28.424
248	Veraval	t	2026-03-13 10:55:28.555	2026-03-13 10:55:28.555
249	Vijalpor	t	2026-03-13 10:55:28.675	2026-03-13 10:55:28.675
250	Vijapur	t	2026-03-13 10:55:28.837	2026-03-13 10:55:28.837
251	Vijaynagar	t	2026-03-13 10:55:28.974	2026-03-13 10:55:28.974
252	Viramgam	t	2026-03-13 10:55:29.097	2026-03-13 10:55:29.097
253	Visavadar	t	2026-03-13 10:55:29.24	2026-03-13 10:55:29.24
254	Visnagar	t	2026-03-13 10:55:29.36	2026-03-13 10:55:29.36
255	Vyara	t	2026-03-13 10:55:29.507	2026-03-13 10:55:29.507
256	Wadhwan	t	2026-03-13 10:55:29.645	2026-03-13 10:55:29.645
257	Waghai	t	2026-03-13 10:55:29.772	2026-03-13 10:55:29.772
258	Wankaner	t	2026-03-13 10:55:29.904	2026-03-13 10:55:29.904
\.


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Customer" (id, name, phone, email, address, "createdAt", "outsideCalls", "carryInServices", "totalInteractions", "lastCallDate", "lastServiceDate", "lastActivityDate") FROM stdin;
1	joy	1231231231	joypatel1509@gmail.com	vaikunth sham	2026-03-12 18:11:16.926	1	0	1	2026-03-12 18:11:17.126	\N	2026-03-12 18:11:17.126
2	shruti patel	8799157041	shrutipatel0308@gmail.com	xcfhjb	2026-03-21 05:50:36.539	2	1	3	2026-04-11 05:55:21.32	2026-03-21 05:57:11.462	2026-04-11 05:55:21.32
4	joy	9265900554	joypatel1595@gmail.com	Vaikunth Dham near Gokuldham\nVisnagar Road, Unjha	2026-04-11 05:59:04.007	1	0	1	2026-04-11 05:59:04.274	\N	2026-04-11 05:59:04.274
3	Shital	9898183378	\N	shivkrupa	2026-03-21 18:08:36.567	0	2	2	\N	2026-04-12 17:00:12.128	2026-04-12 17:00:12.128
\.


--
-- Data for Name: DeletionHistory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."DeletionHistory" (id, "deletedBy", "deletedByName", "deletedAt", "callCount") FROM stdin;
\.


--
-- Data for Name: Location; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Location" (id, name, "isActive", "createdAt", "updatedAt") FROM stdin;
1	UNJHA	t	2026-04-12 17:45:55.098	2026-04-12 17:45:55.098
2	MEHSANA	t	2026-04-12 17:46:05.746	2026-04-12 17:46:05.746
3	AHMEDABAD	t	2026-04-12 17:46:15.142	2026-04-12 17:46:15.142
4	PALANPUR	t	2026-04-12 17:46:23.383	2026-04-12 17:46:23.383
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Notification" (id, "userId", message, type, "isRead", "createdAt", "callId") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Order" (id, "salesEntryId", "orderRemark", "calledBy", status, "createdBy", "createdById", "createdAt", "billingRemark", "billedBy", "billedAt", "completionRemark", "completedBy", "completedAt", "cancelledBy", "cancelledAt", "dispatchFrom", "revertRemark", "brandName") FROM stdin;
1	2	estrdyfugihi	\N	COMPLETED	se	2	2026-03-30 19:47:28.591+00	bibibib	host	2026-03-30 19:48:21.269+00	hehecccc1	host	2026-03-30 19:48:53.996+00	\N	\N	\N	\N	
9	5	for cp2	cp	COMPLETED	host	1	2026-04-01 17:49:41.403+00	bill remark revert checkkk	host	2026-04-01 17:52:36.662+00	completeteetetetetettt check 1	sa	2026-04-01 17:53:06.67+00	\N	\N	\N	\N	
10	5	prince again lol	\N	COMPLETED	host	1	2026-04-01 17:53:30.094+00	fg	host	2026-04-01 17:54:59.052+00	sdf	host	2026-04-01 17:55:01.917+00	\N	\N	\N	\N	
13	5	order id : 1234\nxyctuvybiunm	\N	COMPLETED	se	2	2026-04-02 12:53:37.428+00	bill done	host	2026-04-02 13:03:36.226+00	transport done	host	2026-04-02 13:03:56.286+00	\N	\N	\N	\N	
11	2	perosnal glitch	\N	CANCELLED	host	1	2026-04-01 17:56:43.156+00	aassas	host	2026-04-01 17:57:03.455+00	\N	\N	\N	acc	2026-04-02 13:04:53.11+00	\N	\N	
3	7	wuexticyvubinm	\N	COMPLETED	se	2	2026-03-30 19:49:31.799+00	checkk	acc	2026-03-31 18:24:06.007+00	asasasasaasasaa	acc	2026-03-31 18:24:17.062+00	\N	\N	\N	\N	
15	2	order remark	eng	COMPLETED	host	1	2026-04-10 17:34:57.645+00	bill	host	2026-04-10 17:35:21.805+00	c1	host	2026-04-10 17:35:50.934+00	\N	\N	\N	\N	
6	6	acc	sa	COMPLETED	acc	7	2026-03-30 20:16:18.428+00	billing 1	sa	2026-03-31 18:20:50.019+00	awsasass	host	2026-03-31 18:31:19.894+00	\N	\N	\N	\N	
12	2	check socketttt	\N	CANCELLED	host	1	2026-04-01 18:07:19.907+00	bill	host	2026-04-10 17:36:19.01+00	\N	\N	\N	host	2026-04-10 17:37:18.336+00	\N	\N	
8	3	call of cp!! by accc	cp	BILLED	acc	7	2026-04-01 17:45:33.064+00	bill1	host	2026-04-11 10:06:40.323+00	\N	\N	\N	\N	\N	\N	\N	
4	13	trycvjhbk	\N	COMPLETED	se	2	2026-03-30 19:49:44.971+00	sdf	host	2026-03-31 19:01:32.956+00	t1	host	2026-04-11 10:07:06.152+00	\N	\N	\N	\N	
14	6	zrxcgvhbjn	cp	PENDING	host	1	2026-04-02 13:01:34.069+00	bill1	host	2026-04-02 13:02:24.346+00	\N	\N	\N	\N	\N	\N	\N	
7	16	srdytfyjkbjnk	\N	BILLED	se	2	2026-03-31 19:16:42.708+00	billllllllllllllllllllllllll	host	2026-04-11 18:10:36.481+00	\N	\N	\N	\N	\N	\N	\N	
16	16	order1\nhehe	se	PENDING	host	1	2026-04-11 18:16:37.063+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	
17	1	order2	\N	PENDING	cp	8	2026-04-11 18:20:09.704+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	
5	4	cp1	\N	CANCELLED	cp	8	2026-03-30 20:15:34.797+00	billl hihii	host	2026-03-31 18:31:50.471+00	\N	\N	\N	cp	2026-03-31 18:38:47.44+00	\N	\N	
18	5	bbbbbbbbbbbbbbbb11111111111111111111111111	\N	PENDING	cp	8	2026-04-11 18:24:10.999+00	bbbb11111	sa	2026-04-11 18:26:17.844+00	\N	\N	\N	\N	\N	\N	\N	
2	12	etrchjvbkn	\N	BILLED	se	2	2026-03-30 19:49:15.45+00	billeddddddddddddddddddddddddddd	host	2026-03-31 18:51:43.428+00	\N	\N	\N	\N	\N	\N	\N	
19	10	n1	\N	PENDING	se	2	2026-04-11 18:30:33.111+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	
20	1	scscsc	\N	PENDING	host	1	2026-04-11 19:42:57.029+00	\N	\N	\N	\N	\N	\N	\N	\N	UNJHA,MEHSANA	\N	
21	15	sdfghgfdssdfg	\N	PENDING	host	1	2026-04-11 19:50:55.206+00	\N	\N	\N	\N	\N	\N	\N	\N	MEHSANA	\N	
22	12	hehe	\N	PENDING	host	1	2026-04-12 10:38:09.846+00	\N	\N	\N	\N	\N	\N	\N	\N	UNJHA	\N	DELL
23	10	xfcgdhyjukipokpok\nlkml\nlkm\n;klm'	\N	PENDING	host	1	2026-04-12 16:53:35.844+00	\N	\N	\N	\N	\N	\N	\N	\N	UNJHA	\N	HP
24	7	sdsdd	\N	PENDING	host	1	2026-04-12 17:46:44.922+00	\N	\N	\N	\N	\N	\N	\N	\N	MEHSANA,AHMEDABAD,PALANPUR,UNJHA	\N	Fingers
25	7	cvhjbnm	\N	PENDING	host	1	2026-04-12 18:48:07.979+00	\N	\N	\N	\N	\N	\N	\N	\N	MEHSANA,AHMEDABAD	\N	Fingers
\.


--
-- Data for Name: OrderHold; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."OrderHold" (id, "orderId", remark, "heldBy", "heldById", "heldAt") FROM stdin;
1	1	hihihi1	host	1	2026-03-30 19:47:49.34+00
2	1	222	host	1	2026-03-30 19:48:11.589+00
3	5	h1cp1	acc	7	2026-03-30 20:17:16.097+00
4	5	h2	host	1	2026-03-31 17:47:07.645+00
5	4	hold check	host	1	2026-03-31 18:33:14.631+00
6	4	hold 2	host	1	2026-03-31 18:45:03.552+00
7	9	hold chekkkkk	host	1	2026-04-01 17:50:36.457+00
8	10	hold 111111111111111111111 chekk	host	1	2026-04-01 17:54:23.944+00
9	10	hold revert 1111	host	1	2026-04-01 17:54:43.662+00
10	14	h1	host	1	2026-04-02 13:02:01.888+00
11	12	cvjhb	host	1	2026-04-02 13:07:39.825+00
12	15	h1	host	1	2026-04-10 17:35:09.459+00
13	12	h11	host	1	2026-04-10 17:36:43.081+00
14	18	b2	sa	10	2026-04-11 18:25:07.891+00
15	18	b2	sa	10	2026-04-11 18:25:41.986+00
\.


--
-- Data for Name: OtpToken; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."OtpToken" (id, email, otp, token, "expiresAt", used, "createdAt") FROM stdin;
\.


--
-- Data for Name: PublicAccessToken; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PublicAccessToken" (id, token, "expiresAt", used, "createdAt") FROM stdin;
\.


--
-- Data for Name: SalesEntry; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SalesEntry" (id, "firmName", "gstNo", "contactPerson1Name", "contactPerson1Number", "contactPerson2Name", "contactPerson2Number", "accountContactName", "accountContactNumber", address, landmark, pincode, email, "createdBy", "createdById", "createdAt", "updatedAt", "delayCount", "delayedBy", "lastActivityDate", "reminderDate", area, city, "whatsappNumber") FROM stdin;
1	joy	27ABCDE1234F1Z5	j	9265900554	s	8799157041	p	9265900554	vaikunth sham	near umiya mata	384170	joypatel1595@gmail.com	host	1	2026-03-12 18:14:57.494+00	2026-03-12 18:14:57.494+00	0	{}	\N	\N	vaikunth dham	Unjha	\N
2	deep infotech	27ABCDE1234F2Z5	shruti patel	9825048577	nrupesh patel				baloj complex		384170	shrutipatel0308@gmail.com	host	1	2026-03-13 18:20:13.36+00	2026-03-13 18:20:13.36+00	0	{}	\N	\N	baloj complex	Unjha	\N
3	infotech	27ABCDE1234F2Z7	shruti patel	8799157041			ccount Contact Number		sonal society 		384152	shrutipatel0308@gmail.com	host	1	2026-03-13 18:23:22.365+00	2026-03-13 18:23:22.365+00	0	{}	\N	\N		Ahmedabad	\N
4	hocco	27ABCDE1234F2Z4	shruti patel	9898183378	\N	\N	\N	\N	wyreutxrciyuvibuonm,	\N	384170	\N	Share Link	1	2026-03-13 18:31:21.709+00	2026-03-13 18:31:21.709+00	0	{}	\N	\N	gandhi chowk	Unjha	\N
6	hehe	27ABCDE1234F2Z8	shruti patel	9898183378					qefgnb		384170	shrutipatel0308@gmail.com	se	2	2026-03-14 19:28:15.003+00	2026-03-14 19:28:15.003+00	0	{}	\N	\N	baloj complex	Unjha	\N
7	joy	27ABCDE1234F3Z5	Blaze	9265900554			shruti	8799157041	vaikunth	visnagar road	384170	joypatel1509@gmail.com	se	2	2026-03-15 10:33:41.558+00	2026-03-15 10:33:41.558+00	0	{}	\N	\N	baloj complex	Unjha	9428458929
9	joy	27ABCDE1234F9Z5	Blaze	9265900554	Joy Patel		shruti	8799157041	shivkrupa	visnagar road	384170	joypatel1509@gmail.com	se	2	2026-03-15 10:34:54.53+00	2026-03-15 10:34:54.53+00	0	{}	\N	\N	shivkrupa	Unjha	\N
5	prince 	27ABCDE1234F2Z2	shruti patel	8799157041					shivkrupa		382006	shrutipatel0308@gmail.com	se	2	2026-03-14 19:26:35.643+00	2026-03-15 15:23:00.568+00	0	{}	\N	\N	Rayasan	Gandhinagar	9265900554
10	nrupesh	24AADFD8526D1ZJ	shruti patel	9898183378					gadghlfdghjbknlm;,'.mbnvcbnm,./	ghjkl;fghjklghjkl	385477	shrutipatel0308@gmail.com	host	1	2026-03-15 15:25:20.183+00	2026-03-15 15:25:20.183+00	0	{}	\N	\N	Rayasan	Gandhinagar	\N
12	shrii	23ABCDE1234F2Z5	DeepInfotech	8799157041	Joy	9265900554	shital	9898183378	shivkrupa society 		384170	deepinfotechunjha@gmail.com	host	1	2026-03-18 18:06:59.996+00	2026-03-18 18:33:21.443+00	0	{}	\N	\N	80 ft. ring road	Unjha	9825048577
13	shrutlo2	21ABCDE1234F3Z5	DeepInfotech	8799157041	Joy	9265900554	shital	9898183378	Vaikunth Dham near Gokuldham\nVisnagar Road, Unjha	sr in unjha	384170	joypatel1509@gmail.com	Share Link	1	2026-03-18 18:34:29.27+00	2026-03-18 18:34:29.27+00	0	{}	\N	\N	DIAMONG CHOKDI	Unjha	\N
15	joy22222	27ABCDE1234F3Z0	Joy Patel	9428458929	Joy Patel	8799157041	Joy Patel	9265900554	vaikunth	12	384170	joypatel1595@gmail.com	host	1	2026-03-18 18:36:26.857+00	2026-03-18 19:12:57.101+00	0	{}	\N	\N	a1	Ahwa	9428458929
16	shruti	29AAAGM0289C1ZF	Shruti	8799157041	nrupesh	9825048577	jiyu	9265900554	gvjhb	\N	388255	shruti308patel@gmail.com	Share Link	1	2026-03-31 18:56:30.657+00	2026-03-31 18:56:30.657+00	0	{}	\N	\N	ram temple	Balasinor	\N
\.


--
-- Data for Name: SalesLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SalesLog" (id, "salesEntryId", "logType", "callType", remark, "loggedBy", "loggedById", "loggedAt", latitude, "locationAccuracy", longitude) FROM stdin;
1	1	VISIT	\N	v1	host	1	2026-03-12 18:15:28.337+00	23.79928436279513	103	72.39242808775556
2	1	VISIT	\N	v2	host	1	2026-03-12 18:15:59.056+00	23.79928436279513	103	72.39242808775556
3	6	VISIT	\N	Printer hp stock 3 \nbrother sotck 2 	host	1	2026-03-15 05:42:15.214+00	23.81229626424324	99	72.3861786854978
4	3	CALL	OUTGOING	23	host	1	2026-03-15 15:06:59.62+00	\N	\N	\N
5	10	VISIT	\N	hihi	host	1	2026-03-15 18:20:17.813+00	23.79928333333334	100	72.392441
6	12	VISIT	\N	v1	host	1	2026-03-18 18:32:00.735+00	23.15636483440321	89	72.67084295817452
7	12	CALL	RECEIVED	rec 1	host	1	2026-03-18 18:32:31.517+00	\N	\N	\N
8	12	CALL	OUTGOING	out 1	host	1	2026-03-18 18:32:46.292+00	\N	\N	\N
9	13	VISIT	\N	eRATSZYDXTFCYG	host	1	2026-03-27 18:06:52.382+00	23.812277	149	72.38591
10	15	VISIT	\N	34WSERDTFYGU	host	1	2026-03-27 18:07:24.714+00	\N	\N	\N
11	15	VISIT	\N	EXCFVGBHNJ	host	1	2026-03-27 18:08:05.933+00	23.812277	149	72.38591
12	15	VISIT	\N	v2	host	1	2026-03-27 18:08:08.344+00	23.79928600000001	118	72.39242949999999
13	13	VISIT	\N	xchvjhbkn	host	1	2026-04-02 12:21:11.27+00	23.15763415383704	98	72.66960693173654
14	6	VISIT	\N	gvhjb	host	1	2026-04-02 13:36:24.306+00	23.15763415383704	98	72.66960693173654
15	12	CALL	OUTGOING	CALL TODAY...	host	1	2026-04-05 14:09:18.853+00	\N	\N	\N
16	3	CALL	OUTGOING	call 1 today	host	1	2026-04-05 14:11:58.741+00	\N	\N	\N
17	3	CALL	OUTGOING	call 2	host	1	2026-04-05 14:12:04.823+00	\N	\N	\N
18	3	CALL	OUTGOING	call 3	host	1	2026-04-05 14:12:08.062+00	\N	\N	\N
19	3	CALL	OUTGOING	call 4	host	1	2026-04-05 14:12:10.875+00	\N	\N	\N
20	15	CALL	OUTGOING	call 1	host	1	2026-04-05 14:12:35.529+00	\N	\N	\N
21	10	VISIT	\N	v1	se	2	2026-04-06 10:20:39.467+00	23.1573745	149	72.6692005
22	16	VISIT	\N	print hp 3\ncanon 2\n	host	1	2026-04-10 17:26:40.173+00	\N	\N	\N
23	15	VISIT	\N	hp :3\n	host	1	2026-04-10 17:28:05.364+00	\N	\N	\N
24	13	VISIT	\N	canon 3 	host	1	2026-04-10 17:28:48.479+00	23.812277	107	72.38590999999998
25	16	VISIT	\N	loca ui changed	host	1	2026-04-11 05:33:35.764+00	23.79930521918621	159	72.39243388381534
26	16	VISIT	\N	kkkkkkkkkkkkkkkkkkk	host	1	2026-04-12 16:57:00.159+00	23.812277	149	72.38591
\.


--
-- Data for Name: ServiceCategory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ServiceCategory" (id, name, "isActive", "createdAt", "updatedAt") FROM stdin;
1	printer	t	2026-03-21 05:56:47.475	2026-03-21 05:56:47.475
2	laptop	t	2026-03-21 05:56:52.586	2026-03-21 05:56:52.586
\.


--
-- Data for Name: ServiceDeletionHistory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ServiceDeletionHistory" (id, "deletedBy", "deletedByName", "deletedAt", "serviceCount") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."User" (id, username, password, email, phone, "createdAt", role, "secretPassword", "brandName") FROM stdin;
1	host	$2b$10$jpcqrhF0tdk5MLZE7hSeyOnNzbmBAk1bRMmvHML8aMSlQtA9cKXlu	deepinfotechunjha@gmail.com	8799157041	2026-03-12 18:10:11.073	HOST	$2b$10$wE/C4byqP2ekTc9DfxtWx.lo3KtfmSv0JaolGPVEP7AaHMRWS7nri	\N
2	se	$2b$10$p0.YveSF6.DFLsc7pRw0ouxpt017FDZl9lQE47hic9R40oHBRwGnC	joypatel1509@gmail.com	9265900554	2026-03-13 10:02:08.933	SALES_EXECUTIVE	$2b$10$HaNva210CUYrnvZa6HatW..tJOjyohDtC.DaZ.sMTS2sl9ojlddyO	\N
5	eng	$2b$10$cMPwFSSI8wHRSKIaAxnnGeThizsRPchtXXHfBFEoTM7ZCOG/hhwx.	shrutipatel0308@gmail.com	9898183378	2026-03-13 10:20:34.84	ENGINEER	$2b$10$ci4c1BPBRN8kESOHEnqzxu5ttJRKztcFJp4Bs7K2k4gIwaoVWlyNG	\N
6	admin	$2b$10$P3TYcJCHYldJxeOT/nw3cehegEHscodcUnaEv73crgxFveaHJsO3C	shruti308patel@gmail.com	9825048577	2026-03-13 10:22:11.485	ADMIN	$2b$10$pqbfOCPW7Jkp2asrAxdGf.eqG3CT849NIeZEvxoeyDuth4xwqa82i	\N
7	acc	$2b$10$EFcUQ9M1H18pUSJtjgbv7O7OMyKnwmT5qqfigYG7MJBv4iFaka33O	s@gmail.com	9999999999	2026-03-30 19:41:10.525	ACCOUNTANT	$2b$10$8O9EP172RDQ/hyStDySjweQghmnkuRs5OlAhPjQWMDJuydVHzx10G	\N
8	cp	$2b$10$isHubq3LAwaHMNW.3yByU.1CUKwzAPBFqhr6gpe.5/X54TWB3ubyy	cp@gmail.com	8888888888	2026-03-30 19:42:02.2	COMPANY_PAYROLL	$2b$10$qyS9IgdbDAMQsfAahQ9SNOmAheQePHvaZ9KXYWcPHHerwu4O.ucz2	\N
9	tc	$2b$10$ESsesI/LINTsqTaPCcoL3uP67Xa.Mn3tHATjZrPr7n577pXM5dBMi	tc@gmail.com	7777777777	2026-03-30 19:42:36.314	TALLY_CALLER	$2b$10$nAEUjq1TsKvJkstWH1/8QOuJw2NqsQ1b.PvwR5r8I6ACq1US4F2xm	\N
10	sa	$2b$10$kUiqs7Tp8/TkQ6ehQecnhuIKiBXXtPw9f.l6IMAOZX4U3lM9gVME.	sa@gmail.com	6666666666	2026-03-30 19:43:07.663	SALES_ADMIN	$2b$10$i18UGmbizSZggVnrqJ4phepJf.p6rnYxlEFo7z2hvilrb4vyc9Rei	\N
11	dell	$2b$10$70.PfdmYc3NBySZRmwvUCumo1luaI1.c7y7tUhOKPLIFCubyEBNJ.	d@gmail.com	9999555544	2026-04-12 10:39:10.972	COMPANY_BASED_ACCESS	$2b$10$0xBmH02blST3fQh3mVCsOeT65DPUCmWMXvP72giaaJZXj1LXo9R1y	DELL
12	hp	$2b$10$EkpIaBzHXX9/wYGm.yjhgOb7qdoNVjc2m4/ZZ8vajKhcqb8J7aMA2	hp@gmail.com	9898989898	2026-04-12 16:50:04.518	COMPANY_BASED_ACCESS	$2b$10$sTBE3a57zNRYqIBpcfdrYuXgySWo8DfzNwQMuUXBMdGyglOkVoq.2	HP
\.


--
-- Name: Area_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."Area_id_seq"', 7, true);


--
-- Name: Brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."Brand_id_seq"', 3, true);


--
-- Name: Call_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."Call_id_seq"', 4, true);


--
-- Name: CarryInService_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."CarryInService_id_seq"', 3, true);


--
-- Name: Category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."Category_id_seq"', 2, true);


--
-- Name: City_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."City_id_seq"', 258, true);


--
-- Name: Customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."Customer_id_seq"', 4, true);


--
-- Name: DeletionHistory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."DeletionHistory_id_seq"', 1, false);


--
-- Name: Location_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."Location_id_seq"', 4, true);


--
-- Name: Notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."Notification_id_seq"', 1, false);


--
-- Name: OrderHold_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."OrderHold_id_seq"', 15, true);


--
-- Name: Order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."Order_id_seq"', 25, true);


--
-- Name: OtpToken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."OtpToken_id_seq"', 1, false);


--
-- Name: PublicAccessToken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."PublicAccessToken_id_seq"', 48, true);


--
-- Name: SalesEntry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."SalesEntry_id_seq"', 18, true);


--
-- Name: SalesLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."SalesLog_id_seq"', 26, true);


--
-- Name: ServiceCategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."ServiceCategory_id_seq"', 2, true);


--
-- Name: ServiceDeletionHistory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."ServiceDeletionHistory_id_seq"', 1, false);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."User_id_seq"', 12, true);


--
-- Name: Area Area_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Area"
    ADD CONSTRAINT "Area_pkey" PRIMARY KEY (id);


--
-- Name: Brand Brand_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Brand"
    ADD CONSTRAINT "Brand_pkey" PRIMARY KEY (id);


--
-- Name: Call Call_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Call"
    ADD CONSTRAINT "Call_pkey" PRIMARY KEY (id);


--
-- Name: CarryInService CarryInService_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CarryInService"
    ADD CONSTRAINT "CarryInService_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: City City_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."City"
    ADD CONSTRAINT "City_pkey" PRIMARY KEY (id);


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: DeletionHistory DeletionHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."DeletionHistory"
    ADD CONSTRAINT "DeletionHistory_pkey" PRIMARY KEY (id);


--
-- Name: Location Location_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Location"
    ADD CONSTRAINT "Location_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: OrderHold OrderHold_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderHold"
    ADD CONSTRAINT "OrderHold_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: OtpToken OtpToken_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OtpToken"
    ADD CONSTRAINT "OtpToken_pkey" PRIMARY KEY (id);


--
-- Name: PublicAccessToken PublicAccessToken_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."PublicAccessToken"
    ADD CONSTRAINT "PublicAccessToken_pkey" PRIMARY KEY (id);


--
-- Name: SalesEntry SalesEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SalesEntry"
    ADD CONSTRAINT "SalesEntry_pkey" PRIMARY KEY (id);


--
-- Name: SalesLog SalesLog_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SalesLog"
    ADD CONSTRAINT "SalesLog_pkey" PRIMARY KEY (id);


--
-- Name: ServiceCategory ServiceCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ServiceCategory"
    ADD CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY (id);


--
-- Name: ServiceDeletionHistory ServiceDeletionHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ServiceDeletionHistory"
    ADD CONSTRAINT "ServiceDeletionHistory_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Area_cityId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Area_cityId_idx" ON public."Area" USING btree ("cityId");


--
-- Name: Area_name_cityId_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Area_name_cityId_key" ON public."Area" USING btree (name, "cityId");


--
-- Name: Area_name_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Area_name_idx" ON public."Area" USING btree (name);


--
-- Name: Brand_name_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Brand_name_idx" ON public."Brand" USING btree (name);


--
-- Name: Brand_name_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Brand_name_key" ON public."Brand" USING btree (name);


--
-- Name: Call_assignedTo_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Call_assignedTo_idx" ON public."Call" USING btree ("assignedTo");


--
-- Name: Call_createdBy_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Call_createdBy_idx" ON public."Call" USING btree ("createdBy");


--
-- Name: Call_dcRequired_dcStatus_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Call_dcRequired_dcStatus_idx" ON public."Call" USING btree ("dcRequired", "dcStatus");


--
-- Name: Call_phone_category_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Call_phone_category_status_idx" ON public."Call" USING btree (phone, category, status);


--
-- Name: CarryInService_createdBy_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CarryInService_createdBy_idx" ON public."CarryInService" USING btree ("createdBy");


--
-- Name: CarryInService_phone_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CarryInService_phone_idx" ON public."CarryInService" USING btree (phone);


--
-- Name: CarryInService_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "CarryInService_status_idx" ON public."CarryInService" USING btree (status);


--
-- Name: Category_name_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);


--
-- Name: City_name_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "City_name_idx" ON public."City" USING btree (name);


--
-- Name: City_name_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "City_name_key" ON public."City" USING btree (name);


--
-- Name: Customer_phone_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Customer_phone_key" ON public."Customer" USING btree (phone);


--
-- Name: DeletionHistory_deletedAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "DeletionHistory_deletedAt_idx" ON public."DeletionHistory" USING btree ("deletedAt");


--
-- Name: DeletionHistory_deletedBy_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "DeletionHistory_deletedBy_idx" ON public."DeletionHistory" USING btree ("deletedBy");


--
-- Name: Location_name_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Location_name_idx" ON public."Location" USING btree (name);


--
-- Name: Location_name_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "Location_name_key" ON public."Location" USING btree (name);


--
-- Name: Notification_userId_isRead_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Notification_userId_isRead_idx" ON public."Notification" USING btree ("userId", "isRead");


--
-- Name: OrderHold_heldAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "OrderHold_heldAt_idx" ON public."OrderHold" USING btree ("heldAt");


--
-- Name: OrderHold_orderId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "OrderHold_orderId_idx" ON public."OrderHold" USING btree ("orderId");


--
-- Name: Order_brandName_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Order_brandName_idx" ON public."Order" USING btree ("brandName");


--
-- Name: Order_createdAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Order_createdAt_idx" ON public."Order" USING btree ("createdAt");


--
-- Name: Order_createdById_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Order_createdById_idx" ON public."Order" USING btree ("createdById");


--
-- Name: Order_salesEntryId_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Order_salesEntryId_idx" ON public."Order" USING btree ("salesEntryId");


--
-- Name: Order_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "Order_status_idx" ON public."Order" USING btree (status);


--
-- Name: OtpToken_email_token_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "OtpToken_email_token_idx" ON public."OtpToken" USING btree (email, token);


--
-- Name: OtpToken_expiresAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "OtpToken_expiresAt_idx" ON public."OtpToken" USING btree ("expiresAt");


--
-- Name: OtpToken_token_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "OtpToken_token_key" ON public."OtpToken" USING btree (token);


--
-- Name: PublicAccessToken_expiresAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PublicAccessToken_expiresAt_idx" ON public."PublicAccessToken" USING btree ("expiresAt");


--
-- Name: PublicAccessToken_token_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "PublicAccessToken_token_idx" ON public."PublicAccessToken" USING btree (token);


--
-- Name: PublicAccessToken_token_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "PublicAccessToken_token_key" ON public."PublicAccessToken" USING btree (token);


--
-- Name: SalesEntry_city_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SalesEntry_city_idx" ON public."SalesEntry" USING btree (city);


--
-- Name: SalesEntry_contactPerson1Number_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SalesEntry_contactPerson1Number_idx" ON public."SalesEntry" USING btree ("contactPerson1Number");


--
-- Name: SalesEntry_createdAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SalesEntry_createdAt_idx" ON public."SalesEntry" USING btree ("createdAt");


--
-- Name: SalesEntry_createdBy_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SalesEntry_createdBy_idx" ON public."SalesEntry" USING btree ("createdBy");


--
-- Name: SalesEntry_firmName_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SalesEntry_firmName_idx" ON public."SalesEntry" USING btree ("firmName");


--
-- Name: SalesEntry_gstNo_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SalesEntry_gstNo_idx" ON public."SalesEntry" USING btree ("gstNo");


--
-- Name: SalesEntry_gstNo_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "SalesEntry_gstNo_key" ON public."SalesEntry" USING btree ("gstNo");


--
-- Name: SalesEntry_reminderDate_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SalesEntry_reminderDate_idx" ON public."SalesEntry" USING btree ("reminderDate");


--
-- Name: SalesLog_logType_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SalesLog_logType_idx" ON public."SalesLog" USING btree ("logType");


--
-- Name: SalesLog_loggedAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SalesLog_loggedAt_idx" ON public."SalesLog" USING btree ("loggedAt" DESC);


--
-- Name: SalesLog_loggedBy_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SalesLog_loggedBy_idx" ON public."SalesLog" USING btree ("loggedBy");


--
-- Name: SalesLog_salesEntryId_loggedAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "SalesLog_salesEntryId_loggedAt_idx" ON public."SalesLog" USING btree ("salesEntryId", "loggedAt" DESC);


--
-- Name: ServiceCategory_name_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "ServiceCategory_name_key" ON public."ServiceCategory" USING btree (name);


--
-- Name: ServiceDeletionHistory_deletedAt_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ServiceDeletionHistory_deletedAt_idx" ON public."ServiceDeletionHistory" USING btree ("deletedAt");


--
-- Name: ServiceDeletionHistory_deletedBy_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "ServiceDeletionHistory_deletedBy_idx" ON public."ServiceDeletionHistory" USING btree ("deletedBy");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_phone_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "User_phone_key" ON public."User" USING btree (phone);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: Area Area_cityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Area"
    ADD CONSTRAINT "Area_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES public."City"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Call Call_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Call"
    ADD CONSTRAINT "Call_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CarryInService CarryInService_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CarryInService"
    ADD CONSTRAINT "CarryInService_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DeletionHistory DeletionHistory_deletedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."DeletionHistory"
    ADD CONSTRAINT "DeletionHistory_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderHold OrderHold_heldById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderHold"
    ADD CONSTRAINT "OrderHold_heldById_fkey" FOREIGN KEY ("heldById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderHold OrderHold_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."OrderHold"
    ADD CONSTRAINT "OrderHold_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_salesEntryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_salesEntryId_fkey" FOREIGN KEY ("salesEntryId") REFERENCES public."SalesEntry"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SalesEntry SalesEntry_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SalesEntry"
    ADD CONSTRAINT "SalesEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SalesLog SalesLog_loggedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SalesLog"
    ADD CONSTRAINT "SalesLog_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SalesLog SalesLog_salesEntryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."SalesLog"
    ADD CONSTRAINT "SalesLog_salesEntryId_fkey" FOREIGN KEY ("salesEntryId") REFERENCES public."SalesEntry"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ServiceDeletionHistory ServiceDeletionHistory_deletedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ServiceDeletionHistory"
    ADD CONSTRAINT "ServiceDeletionHistory_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: neondb_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict lCNE215EvGYbVSdrn47LPPZhlc2XtF4kUlw4s4wDJVA2hZH37xm03lQaMeYwl2o

