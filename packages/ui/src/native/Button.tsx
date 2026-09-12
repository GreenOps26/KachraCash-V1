import type { PressableProps, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../tokens';

type Variant = 'primary' | 'gold' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'field';

interface ButtonProps extends Omit<PressableProps, 'style'> {
	variant?: Variant;
	size?: Size;
	label: string;
	style?: StyleProp<ViewStyle>;
	labelStyle?: StyleProp<TextStyle>;
}

const variantStyles: Record<Variant, ViewStyle> = {
	primary: { backgroundColor: colors.forest600, borderColor: colors.forest600 },
	gold: { backgroundColor: colors.gold500, borderColor: colors.gold500 },
	outline: { backgroundColor: 'transparent', borderColor: colors.sand400 },
	ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
	danger: { backgroundColor: colors.coral600, borderColor: colors.coral600 }
};

const sizeStyles: Record<Size, ViewStyle> = {
	sm: { paddingVertical: 8, paddingHorizontal: 14 },
	md: { paddingVertical: 10, paddingHorizontal: 20 },
	lg: { paddingVertical: 14, paddingHorizontal: 24 },
	field: { paddingVertical: 12, paddingHorizontal: 16, width: '100%' }
};

export function Button({
	variant = 'primary',
	size = 'md',
	label,
	disabled,
	style,
	labelStyle,
	...rest
}: ButtonProps) {
	return (
		<Pressable
			accessibilityRole="button"
			disabled={disabled}
			style={({ pressed }) => [
				styles.base,
				variantStyles[variant],
				sizeStyles[size],
				pressed && !disabled && styles.pressed,
				disabled && styles.disabled,
				style
			]}
			{...rest}
		>
			<Text
				style={[
					styles.label,
					variant === 'outline' || variant === 'ghost' ? styles.labelDark : styles.labelLight,
					labelStyle
				]}
			>
				{label}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	base: {
		borderRadius: 999,
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	label: {
		fontFamily: fonts.body,
		fontSize: 14,
		fontWeight: '600'
	},
	labelLight: { color: colors.cream50 },
	labelDark: { color: colors.ink900 },
	pressed: { transform: [{ scale: 0.97 }] },
	disabled: { opacity: 0.5 }
});
