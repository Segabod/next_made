import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'NextMade | Make your next move real',description:'Your workspace for goals, accountability, practical progress and an AI advisory board.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
