import { z } from 'zod';
const short=z.string().max(500),id=z.string().min(1).max(100);
export const stateSchema=z.object({
profile:z.object({name:z.string().max(80),path:z.string().max(80),style:z.enum(['Supportive','Direct','Structured']),timezone:z.string().max(80),reminders:z.boolean()}),
goals:z.array(z.object({id,title:short,category:short,due:z.string().max(30),why:z.string().max(2000),created:z.string().max(40),paused:z.boolean()})).max(100),
tasks:z.array(z.object({id,goalId:id,title:short,due:z.string().max(30),status:z.enum(['planned','completed','blocked']),created:z.string().max(40)})).max(1000),
logs:z.array(z.object({id,goalId:z.string().max(100),activity:z.string().max(3000),learning:z.string().max(3000),blocker:z.string().max(2000),next:short,created:z.string().max(40),evidence:z.string().max(2000)})).max(1000),
messages:z.array(z.object({id,role:z.enum(['user','assistant']),text:z.string().max(10000),created:z.string().max(40)})).max(200),
decisions:z.array(z.object({id,title:short,context:z.string().max(12000),advisers:z.array(short).max(8),analysis:z.string().max(20000),decision:z.string().max(3000),action:short,due:z.string().max(30),approved:z.boolean(),created:z.string().max(40)})).max(200),
meetings:z.array(z.object({id,title:short,notes:z.string().max(20000),summary:z.string().max(20000),created:z.string().max(40),consent:z.boolean()})).max(100),
challenges:z.array(id).max(100),files:z.array(z.object({id,name:short,size:z.number().nonnegative(),created:z.string().max(40)})).max(100)
}).strict();
export type Workspace=z.infer<typeof stateSchema>;
export function emptyWorkspace(name=''):Workspace{return {profile:{name,path:'Start a business',style:'Supportive',timezone:'America/Toronto',reminders:false},goals:[],tasks:[],logs:[],messages:[],decisions:[],meetings:[],challenges:[],files:[]};}
export const advisers=[
{id:'strategy',name:'The Strategist',role:'Strategy & positioning',initial:'S',color:'#567c69',question:'Which customer problem is urgent enough to pay for?',lens:'Challenge buyer, positioning, alternatives, demand and assumptions.'},
{id:'innovation',name:'The Architect',role:'Innovation & product',initial:'A',color:'#8071a8',question:'What is the simplest way to test this?',lens:'Use first principles, simplify constraints and propose bounded experiments.'},
{id:'finance',name:'The Analyst',role:'Finance & investment',initial:'F',color:'#b8874f',question:'What has to be true for the numbers to work?',lens:'Examine transparent unit economics, cash needs and capital milestones; avoid personal investment recommendations.'},
{id:'operations',name:'The Operator',role:'Execution & scale',initial:'O',color:'#5c83a2',question:'Can you deliver this consistently?',lens:'Review capacity, dependencies, supply chain, quality and execution.'},
{id:'governance',name:'The Steward',role:'Governance & leadership',initial:'G',color:'#aa7477',question:'Who is affected by this decision?',lens:'Examine stakeholder responsibility, access, governance and team alignment.'},
{id:'growth',name:'The Connector',role:'Growth & partnerships',initial:'C',color:'#899458',question:'How will your first customers find you?',lens:'Review distribution, partnerships, customer acquisition and retention.'}];
export function progress(s:Workspace,goalId?:string){const ts=s.tasks.filter(t=>!goalId||t.goalId===goalId);return {done:ts.filter(t=>t.status==='completed').length,total:ts.length};}
export function points(s:Workspace){return s.goals.length*10+s.tasks.filter(t=>t.status==='completed').length*5+s.logs.length*5+s.decisions.filter(d=>d.approved).length*10;}
export function localDay(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function review(s:Workspace){const cut=Date.now()-7*86400000;const logs=s.logs.filter(l=>Date.parse(l.created)>=cut);return {logs,completed:s.tasks.filter(t=>t.status==='completed'),blocked:s.tasks.filter(t=>t.status==='blocked'),next:s.tasks.filter(t=>t.status==='planned').sort((a,b)=>a.due.localeCompare(b.due)),learnings:logs.map(l=>l.learning).filter(Boolean)};}
