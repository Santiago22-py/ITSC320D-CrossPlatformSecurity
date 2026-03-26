import React from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TRootStackParamList } from './App';

interface IProps {
	onLogin: (username: string, password: string) => Promise<boolean>;
}

type TProps = NativeStackScreenProps<TRootStackParamList, 'Login'> & IProps;

export default function Login(props: TProps) {
	const [username, setUsername] = React.useState('');
	const [password, setPassword] = React.useState('');
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	async function login() {
		if (isSubmitting) {
			return;
		}

		// SECURITY FIX:
		// Added input validation to prevent invalid or malicious input.

		// Username validation (only letters/numbers, 3–20 chars)
		if (!/^[a-zA-Z0-9]{3,20}$/.test(username.trim())) {
			Alert.alert("Invalid Username", "Username must be 3-20 characters and contain only letters and numbers.");
			return;
		}

		// Password validation (min 8 chars)
		if (password.length < 8) {
			Alert.alert("Invalid Password", "Password must be at least 8 characters long.");
			return;
		}

		setIsSubmitting(true);
		const isAuthenticated = await props.onLogin(username, password);
		setIsSubmitting(false);

		if (!isAuthenticated) {
			Alert.alert('Error', 'Username or password is invalid.');
			return;
		}

		setPassword('');
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Login</Text>
			<TextInput
				style={styles.username}
				value={username}
				onChangeText={setUsername}
				placeholder="Username"
			/>
			<TextInput
				style={styles.password}
				value={password}
				onChangeText={setPassword}
				placeholder="Password"
				secureTextEntry
			/>
			<Button title={isSubmitting ? 'Signing In...' : 'Login'} onPress={login} disabled={isSubmitting} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#fff',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
	},
	username: {
		borderWidth: 1,
		borderColor: '#ccc',
		padding: 10,
		marginBottom: 10,
	},
	password: {
		borderWidth: 1,
		borderColor: '#ccc',
		padding: 10,
		marginBottom: 10,
	}
});
