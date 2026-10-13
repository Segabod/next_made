import {configured} from '../../lib/backend';import Login from './sign-in';
export const dynamic='force-dynamic';
export default function Page(){return <Login ready={configured()}/>;}
