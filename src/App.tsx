import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Notes from './Notes';
import Login from './Login';
import { authenticateUser, IAuthSession, isSessionValid } from './auth';

export type TRootStackParamList = {
	Login: undefined;
	Notes: undefined;
};

const Stack = createNativeStackNavigator<TRootStackParamList>();

function App() {
	const [session, setSession] = React.useState<IAuthSession | null>(null);

	async function handleLogin(username: string, password: string) {
		const authenticatedSession = await authenticateUser(username, password);

		if (!authenticatedSession) {
			return false;
		}

		setSession(authenticatedSession);
		return true;
	}

	function handleLogout() {
		setSession(null);
	}

	return (
		<NavigationContainer>
			<Stack.Navigator>
				{!isSessionValid(session) ? (
					<Stack.Screen name="Login">
						{(props) => <Login {...props} onLogin={handleLogin} />}
					</Stack.Screen>
				) : (
					<Stack.Screen name="Notes">
						{(props) => (
							<Notes
								{...props}
								session={session as IAuthSession}
								isSessionValid={isSessionValid}
								onLogout={handleLogout}
							/>
						)}
					</Stack.Screen>
				)}
			</Stack.Navigator>
		</NavigationContainer>
	);
}

export default App;
