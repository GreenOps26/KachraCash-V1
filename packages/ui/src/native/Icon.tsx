import Svg, { Path } from 'react-native-svg';
import { colors } from '../tokens';

export type IconName =
	| 'bottle'
	| 'paper'
	| 'metal'
	| 'calendar'
	| 'scale'
	| 'check'
	| 'arrow-left'
	| 'refresh'
	| 'location';

interface IconProps {
	name: IconName;
	size?: number;
	color?: string;
}

const paths: Record<IconName, string> = {
	bottle: 'M10 2h4v3h2a2 2 0 0 1 2 2v11a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V7a2 2 0 0 1 2-2h2V2Z',
	paper: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6M8 13h8M8 17h5',
	metal: 'M4 8h16M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2M8 12h8M10 16h4',
	calendar:
		'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
	scale: 'M12 3v18M3 12h18M6 6l12 12M18 6 6 18',
	check: 'M20 6 9 17l-5-5',
	'arrow-left': 'M19 12H5M12 19l-7-7 7-7',
	refresh: 'M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6M3 12a9 9 0 1 0 2.64 6.36M3 21v-6h6',
	location: 'M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Zm0-7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'
};

export function Icon({ name, size = 18, color = colors.forest600 }: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				d={paths[name]}
				stroke={color}
				strokeWidth={1.8}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}
