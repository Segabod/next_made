import type {Metadata} from 'next';import {DM_Sans} from 'next/font/google';import './globals.css';import './growth.css';
export const metadata:Metadata={title:'NextMade | Make your next move real',description:'Your workspace for goals, accountability, practical progress and an AI advisory board.',icons:{icon:'/favicon.svg'}};
const brandFont=DM_Sans({subsets:['latin'],weight:['700'],variable:'--font-brand'});
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={brandFont.variable}><body>{children}</body></html>;}
