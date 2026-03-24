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
