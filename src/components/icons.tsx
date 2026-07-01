import Svg, { Circle, G, Line, Path, Polyline, Rect } from "react-native-svg";

export function ChevronLeftIcon({ color = "#14161B", size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="15 18 9 12 15 6" />
    </Svg>
  );
}

export function SunMarkIcon({ color = "#E2912A", size = 42 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Path d="M22 15a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" fill={color} />
      <G stroke={color} strokeWidth={2.4} strokeLinecap="round">
        <Line x1={22} y1={12} x2={22} y2={6.5} />
        <Line x1={22} y1={32} x2={22} y2={37.5} />
        <Line x1={12} y1={22} x2={6.5} y2={22} />
        <Line x1={32} y1={22} x2={37.5} y2={22} />
        <Line x1={15} y1={15} x2={11.25} y2={11.25} />
        <Line x1={29} y1={29} x2={32.75} y2={32.75} />
        <Line x1={29} y1={15} x2={32.75} y2={11.25} />
        <Line x1={15} y1={29} x2={11.25} y2={32.75} />
      </G>
    </Svg>
  );
}

export function AppleIcon({ color = "#fff", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M16.365 1.43c0 1.14-.42 2.21-1.13 3.02-.79.91-2.09 1.61-3.16 1.53-.13-1.09.45-2.26 1.13-3.01.78-.86 2.13-1.5 3.16-1.54zM20.5 17.06c-.55 1.27-.82 1.84-1.53 2.97-.99 1.57-2.39 3.53-4.12 3.54-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.02-3.05-1.79-4.04-3.36-2.77-4.31-3.1-9.35-1.22-12.19 1.16-1.77 2.99-2.81 4.71-2.81 1.75 0 2.85 1.05 4.3 1.05 1.4 0 2.26-1.05 4.29-1.05 1.54 0 3.17.84 4.33 2.29-3.81 2.09-3.19 7.53.82 9.17z" />
    </Svg>
  );
}

export function GoogleIcon({ size = 19 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <Path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <Path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <Path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </Svg>
  );
}

export function MailIcon({ color = "#9aa0a8", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={2.5} y={4.5} width={19} height={15} rx={2.5} />
      <Path d="m3 6 9 6 9-6" />
    </Svg>
  );
}

export function LockIcon({ color = "#9aa0a8", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={4} y={10.5} width={16} height={10.5} rx={2.5} />
      <Path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </Svg>
  );
}

export function PinIcon({ color = "#E2912A", size = 15 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
      <Circle cx={12} cy={10} r={2.4} />
    </Svg>
  );
}

export function TargetIcon({ color = "#F5B85C", size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Circle cx={12} cy={12} r={9} />
      <Circle cx={12} cy={12} r={4} />
      <Circle cx={12} cy={12} r={1.3} fill={color} stroke="none" />
    </Svg>
  );
}

export function ChevronRightIcon({ color = "#71757E", size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="9 18 15 12 9 6" />
    </Svg>
  );
}

export function FlameIcon({ color = "#D9534F", size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1.5.6-2.8 1.3-3.8" />
      <Path d="M12 22a6 6 0 0 0 6-6c0-2-1-3.8-2.5-5" />
    </Svg>
  );
}

export function RefreshIcon({ color = "#E2912A", size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 12a9 9 0 1 1-3.5-7.1" />
      <Polyline points="21 4 21 9 16 9" />
    </Svg>
  );
}

export function SunRaysIcon({ color = "#fff", size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Circle cx={12} cy={12} r={4.5} />
      <G strokeLinecap="round">
        <Line x1={12} y1={3} x2={12} y2={5} />
        <Line x1={12} y1={19} x2={12} y2={21} />
        <Line x1={3} y1={12} x2={5} y2={12} />
        <Line x1={19} y1={12} x2={21} y2={12} />
        <Line x1={5.6} y1={5.6} x2={7} y2={7} />
        <Line x1={17} y1={17} x2={18.4} y2={18.4} />
        <Line x1={18.4} y1={5.6} x2={17} y2={7} />
        <Line x1={7} y1={17} x2={5.6} y2={18.4} />
      </G>
    </Svg>
  );
}

export function ActivityIcon({ color = "#9aa0a8", size = 21 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 12h4l2 6 4-14 2 8h6" />
    </Svg>
  );
}

export function CalendarIcon({ color = "#9aa0a8", size = 21 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={4} width={18} height={17} rx={3} />
      <Line x1={3} y1={9} x2={21} y2={9} />
      <Line x1={8} y1={2} x2={8} y2={6} />
      <Line x1={16} y1={2} x2={16} y2={6} />
    </Svg>
  );
}

export function AlertCircleIcon({ color = "#E2912A", size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2}>
      <Circle cx={12} cy={12} r={9} />
      <Line x1={12} y1={8} x2={12} y2={13} strokeLinecap="round" />
      <Circle cx={12} cy={16.4} r={0.4} fill={color} stroke="none" />
    </Svg>
  );
}

export function UserIcon({ color = "#9aa0a8", size = 21 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
    </Svg>
  );
}
