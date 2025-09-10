
-- SCHEMA & SEED for AI Audit Survey
-- Run this in Supabase SQL Editor

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- 1) Core tables
create table if not exists surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  employees_total int,
  employees_it int,
  employees_it_audit int,
  has_ai_unit boolean,
  created_at timestamptz default now()
);

create table if not exists respondents (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references surveys(id) on delete cascade,
  institution_id uuid references institutions(id) on delete set null,
  email text,
  ip_inferred inet,
  user_agent text,
  token text,
  submitted_at timestamptz default now()
);

do $$ begin
  create type question_type as enum ('text', 'number', 'single', 'multi', 'longtext');
exception
  when duplicate_object then null;
end $$;

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references surveys(id) on delete cascade,
  code text unique,
  section text not null,
  prompt text not null,
  qtype question_type not null,
  order_index int not null
);

create table if not exists question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  label text not null,
  value text not null,
  order_index int not null
);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  respondent_id uuid references respondents(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  option_id uuid references question_options(id),
  value_text text,
  value_number numeric,
  created_at timestamptz default now()
);

create table if not exists invite_tokens (
  token text primary key,
  survey_id uuid references surveys(id) on delete cascade,
  email text,
  used_at timestamptz
);

create index if not exists respondents_survey_id_idx on respondents (survey_id);
create index if not exists answers_question_id_idx on answers (question_id);
create index if not exists answers_respondent_id_idx on answers (respondent_id);
create index if not exists invite_tokens_survey_id_idx on invite_tokens (survey_id);

-- 2) RLS
alter table surveys enable row level security;
alter table institutions enable row level security;
alter table respondents enable row level security;
alter table questions enable row level security;
alter table question_options enable row level security;
alter table answers enable row level security;
alter table invite_tokens enable row level security;

-- Lock down selects by default; allow inserts for public tables used by the form
do $$ begin
  -- institutions: allow insert to anyone (the server route uses service role, but keep open for flexibility)
  create policy institutions_insert_any on institutions for insert using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy respondents_insert_any on respondents for insert using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy answers_insert_any on answers for insert using (true) with check (true);
exception when duplicate_object then null; end $$;

-- Allow select to service role only (server-side); no public select policies created.

-- 3) Seed one survey and all questions
insert into surveys (title, description, is_active)
values ('Survey on the Use of AI and Digital Technologies in Audit Work', 'To assess the extent to which SAIs rely on AI and digital technologies.', true)
on conflict do nothing;

-- Grab the latest survey id
with s as (
  select id from surveys where is_active = true order by created_at desc limit 1
)
insert into questions (survey_id, code, section, prompt, qtype, order_index)
select s.id, q.code, q.section, q.prompt, q.qtype::question_type, q.order_index
from s, (values
  ('Q1','General Information','Name of the Supreme Audit Institution:','text',1),
  ('Q2','General Information','Country:','text',2),
  ('Q3','General Information','Number of employees:','number',3),
  ('Q4','General Information','Number of employees in the Information Technology field:','number',4),
  ('Q5','General Information','Number of employees in IT auditing:','number',5),
  ('Q6','General Information','Does the SAI have a dedicated AI unit?','single',6),

  ('Q7','Use of AI','Does your SAI use AI in audit work?','single',7),
  ('Q8','Use of AI','How satisfied are you with the results of using AI?','single',8),
  ('Q9','Use of AI','In which areas are AI currently being used? (Select all that apply)','multi',9),
  ('Q10','Use of AI','What types of AI technologies are being used?','multi',10),
  ('Q11','Use of AI','What are the data sources used by AI in your SAI?','multi',11),
  ('Q12','Use of AI','Is there collaboration with external entities in developing AI solutions?','single',12),

  ('Q13','Technologies & Software','What software tools are currently used in data analysis?','multi',13),
  ('Q14','Technologies & Software','Do these software tools rely on AI?','single',14),
  ('Q15','Technologies & Software','Do you use Robotic Process Automation (RPA) tools?','single',15),
  ('Q16','Technologies & Software','Does your SAI use Big Data Analytics tools?','single',16),
  ('Q17','Technologies & Software','Do you have anomaly detection tools?','single',17),
  ('Q18','Technologies & Software','How well are the current software tools integrated with government databases?','single',18),
  ('Q19','Technologies & Software','Are data visualization techniques being used?','single',19),
  ('Q20','Technologies & Software','Which software tools have proven most effective in audit work?','longtext',20),
  ('Q21','Technologies & Software','Do you have a plan to update or replace current tools within the next two years?','single',21),

  ('Q22','Human Resources & Challenges','Does the SAI have specialists in artificial intelligence or data science?','single',22),
  ('Q23','Human Resources & Challenges','How sufficient is staff training in AI technologies?','single',23),
  ('Q24','Human Resources & Challenges','What are the main challenges in applying AI? (Select all that apply)','multi',24),
  ('Q25','Human Resources & Challenges','What type of support do you need to strengthen AI adoption? (Select all that apply)','multi',25),
  ('Q26','Human Resources & Challenges','Is there a clear strategic plan for AI use?','single',26)
) as q(code, section, prompt, qtype, order_index)
on conflict (code) do nothing;

-- Options
-- Helper macros:
-- single-choice labels
with q as (select id, code from questions)

-- Q6 Yes/No
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values ('Q6','Yes','yes',1),('Q6','No','no',2)) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q7 AI use
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values
  ('Q7','No','no',1),
  ('Q7','Pilot/Experimental stage','pilot',2),
  ('Q7','Yes, partially','partial',3),
  ('Q7','Yes, extensively','extensive',4)
) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q8 Satisfaction
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values
  ('Q8','Not satisfied','not_satisfied',1),
  ('Q8','Partially satisfied','partially_satisfied',2),
  ('Q8','Highly satisfied','highly_satisfied',3)
) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q9 Areas (multi)
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values
  ('Q9','Audit planning','audit_planning',1),
  ('Q9','Risk identification','risk_identification',2),
  ('Q9','Automated data analysis','automated_data_analysis',3),
  ('Q9','Fraud detection','fraud_detection',4),
  ('Q9','Report preparation','report_preparation',5),
  ('Q9','Other (please specify)','other',6)
) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q10 Types of AI (multi)
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values
  ('Q10','Machine Learning','ml',1),
  ('Q10','Natural Language Processing (NLP)','nlp',2),
  ('Q10','Neural Networks','nn',3),
  ('Q10','Predictive Analytics','predictive_analytics',4),
  ('Q10','None of the above currently','none',5),
  ('Q10','Other (please specify)','other',6)
) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q11 Data sources (multi)
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values
  ('Q11','Government databases','gov_db',1),
  ('Q11','Previous audit reports','prev_audit_reports',2),
  ('Q11','Financial and accounting data','financial_data',3),
  ('Q11','Other (please specify)','other',4)
) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q12 Collaboration yes/no
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values
  ('Q12','Yes','yes',1),
  ('Q12','No','no',2)
) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q13 Tools used (multi)
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values
  ('Q13','Excel','excel',1),
  ('Q13','IDEA','idea',2),
  ('Q13','ACL','acl',3),
  ('Q13','Power BI','power_bi',4),
  ('Q13','In-house developed software','in_house',5),
  ('Q13','Other','other',6)
) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q14 Do tools rely on AI (yes/no)
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values ('Q14','Yes','yes',1),('Q14','No','no',2)) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q15 RPA yes/no
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values ('Q15','Yes','yes',1),('Q15','No','no',2)) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q16 Big Data yes/no
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values ('Q16','Yes','yes',1),('Q16','No','no',2)) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q17 Anomaly detection yes/no
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values ('Q17','Yes','yes',1),('Q17','No','no',2)) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q18 Integration level
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values
  ('Q18','High','high',1),
  ('Q18','Medium','medium',2),
  ('Q18','Low','low',3),
  ('Q18','Not integrated','not_integrated',4)
) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q19 Data visualization yes/no
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values ('Q19','Yes','yes',1),('Q19','No','no',2)) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q21 Plan to update yes/no
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values ('Q21','Yes','yes',1),('Q21','No','no',2)) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q22 Specialists yes/no
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values ('Q22','Yes','yes',1),('Q22','No','no',2)) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q23 Training sufficiency
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values
  ('Q23','Very sufficient','very',1),
  ('Q23','Moderate','moderate',2),
  ('Q23','Insufficient','insufficient',3),
  ('Q23','No training','none',4)
) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q24 Challenges (multi)
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values
  ('Q24','Lack of expertise','lack_expertise',1),
  ('Q24','Lack of funding','lack_funding',2),
  ('Q24','Resistance to change','resistance_change',3),
  ('Q24','Limited data availability','limited_data',4),
  ('Q24','Legal/Regulatory challenges','legal_regulatory',5),
  ('Q24','Other (please specify)','other',6)
) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q25 Support needed (multi)
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values
  ('Q25','Funding','funding',1),
  ('Q25','Training','training',2),
  ('Q25','Knowledge/experience sharing','knowledge_sharing',3),
  ('Q25','Legislative development','legislative',4),
  ('Q25','Technical support','technical_support',5),
  ('Q25','Other (please specify)','other',6)
) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- Q26 Strategic plan yes/no
insert into question_options (question_id,label,value,order_index)
select q.id, v.label, v.value, v.ord
from q join (values ('Q26','Yes','yes',1),('Q26','No','no',2)) as v(code,label,value,ord) on v.code=q.code
on conflict do nothing;

-- 4) SQL helper functions (optional) for /api/stats
create or replace function count_responses(s_id uuid)
returns table(count int8) language sql as $$
  select count(*)::int8 from respondents where survey_id = s_id;
$$;

create or replace function breakdown_single_choice(question_code text)
returns table(label text, value text, count int8) language sql as $$
  select o.label, o.value, count(*)::int8
  from answers a
  join questions q on q.id = a.question_id
  join question_options o on o.id = a.option_id
  where q.code = question_code
  group by o.label, o.value
  order by count(*) desc;
$$;

-- 5) (Optional) invite tokens generator example
-- insert into invite_tokens(token, survey_id)
-- select encode(gen_random_bytes(16), 'hex'), (select id from surveys where is_active=true limit 1)
-- from generate_series(1, 150);
