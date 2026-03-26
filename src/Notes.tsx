import React from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Note from './components/Note';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TRootStackParamList } from './App';
import { IAuthSession } from './auth';

export interface INote {
	title: string;
	text: string;
}

interface IProps {
	session: IAuthSession;
	isSessionValid: (session: IAuthSession | null | undefined) => boolean;
	onLogout: () => void;
}

interface IState {
	notes: INote[];
	newNoteTitle: string;
	newNoteEquation: string;
}

type TProps = NativeStackScreenProps<TRootStackParamList, 'Notes'> & IProps;

export default class Notes extends React.Component<TProps, IState> {
	constructor(props: Readonly<TProps>) {
		super(props);

		this.state = {
			notes: [],
			newNoteTitle: '',
			newNoteEquation: ''
		};

		this.onNoteTitleChange = this.onNoteTitleChange.bind(this);
		this.onNoteEquationChange = this.onNoteEquationChange.bind(this);
		this.addNote = this.addNote.bind(this);
	}

	public async componentDidMount() {
		if (!this.props.isSessionValid(this.props.session)) {
			Alert.alert('Session Expired', 'Please login again to access your notes.');
			this.props.onLogout();
			return;
		}

		const existing = await this.getStoredNotes();

		this.setState({ notes: existing });
	}

	public async componentWillUnmount() {
		this.storeNotes(this.state.notes);
	}

	// CHANGED
	private async getStoredNotes(): Promise<INote[]> {
		/*
			* SECURITY FIX - Type: Insecure Data Storage
		* BEFORE: The notes were stored in AsyncStorage, whcih included both the username and password in the key. T
		* PROBLEM: This is a security risk, as anyone with access to the device can easily
		* 		   retrieve the username and password from the key
		* AFTER: We are now storing the notes using only the username as part of the key
		*        the password is no longer included, reducing the risk of exposing sensitive information through the key.
		* 	
		*/
		const storageKey = 'notes-' + this.props.session.username;

		const value = await AsyncStorage.getItem(storageKey);

		if (value !== null) {
			return JSON.parse(value);
		} else {
			return [];
		}
	}

	// CHANGED
	private async storeNotes(notes: INote[]) {
		/*
		* SECURITY FIX - Type: Insecure Data Storage
		* BEFORE: The storage key was built using both username and password
		* PROBLEM: Sensitive information (password) was included in the storage key,
		*          which could be easily accessed by anyone with access to the device
		* AFTER: The password is no longer included in the storage key, once again
		*        using only the username to identify the user's notes, 
		*        thus reducing the risk of exposing sensitive information through the key.
		*/
		const storageKey = 'notes-' + this.props.session.username;

		const jsonValue = JSON.stringify(notes);
		await AsyncStorage.setItem(storageKey, jsonValue);
	}

	private onNoteTitleChange(value: string) {
		this.setState({ newNoteTitle: value });
	}

	private onNoteEquationChange(value: string) {
		this.setState({ newNoteEquation: value });
	}

	private addNote() {
		/*
		* SECURITY FIX - Type: Improper Authentication
		* BEFORE: Protected actions could run without re-checking whether the session
		*         was still valid after the user reached the screen.
		* AFTER: The app now blocks note creation when the authenticated session is
		*        missing or expired and forces the user back to login.
		*/
		if (!this.props.isSessionValid(this.props.session)) {
			Alert.alert('Session Expired', 'Please login again before adding a note.');
			this.props.onLogout();
			return;
		}

		// SECURITY FIX - Type: Insufficient Input Validation
		// BEFORE: User inputs (title and equation) were accepted without validation.
		// PROBLEM: This could allow invalid or malicious input, leading to errors or security risks.
		// AFTER: Added validation for length, allowed characters, and empty input to ensure safe data handling.

		const title = this.state.newNoteTitle;
		const equation = this.state.newNoteEquation;

		// Title validation
		if (!title || title.trim().length < 3) {
			Alert.alert("Invalid Title", "Title must be at least 3 characters long.");
			return;
		}

		// Only letters, numbers, spaces
		if (!/^[a-zA-Z0-9\s]+$/.test(title)) {
			Alert.alert("Invalid Title", "Only letters and numbers allowed.");
			return;
		}

		// Equation validation
		if (!equation || equation.trim() === "") {
			Alert.alert("Invalid Input", "Equation cannot be empty.");
			return;
		}

		// Only allow numbers and math operators
		if (!/^[0-9+\-*/()]+$/.test(equation)) {
			Alert.alert("Invalid Input", "Equation contains invalid characters.");
			return;
		}

		// Prevent very long input
		if (equation.length > 50) {
			Alert.alert("Invalid Input", "Equation too long.");
			return;
		}

		const note: INote = {
			title: title.trim(),
			text: equation.trim()
		};

		this.setState({
			notes: this.state.notes.concat(note),
			newNoteTitle: '',
			newNoteEquation: ''
		});
	}

	public render() {
		return (
			<SafeAreaView>
				<ScrollView contentInsetAdjustmentBehavior="automatic">
					<View style={styles.container}>
						<Text style={styles.title}>
							{'Math Notes: ' + this.props.session.username}
						</Text>
						<Button title="Logout" onPress={this.props.onLogout} />
						<TextInput
							style={styles.titleInput}
							value={this.state.newNoteTitle}
							onChangeText={this.onNoteTitleChange}
							placeholder="Enter your title"
						/>
						<TextInput
							style={styles.textInput}
							value={this.state.newNoteEquation}
							onChangeText={this.onNoteEquationChange}
							placeholder="Enter your math equation"
						/>
						<Button title="Add Note" onPress={this.addNote} />

						<View style={styles.notes}>
							{this.state.notes.map((note, index) => (
								<Note key={index} title={note.title} text={note.text} />
							))}
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
		);
	}
}

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
	titleInput: {
		borderWidth: 1,
		borderColor: '#ccc',
		padding: 10,
		marginBottom: 10,
	},
	textInput: {
		borderWidth: 1,
		borderColor: '#ccc',
		padding: 10,
		marginBottom: 10,
	},
	notes: {
		marginTop: 15
	},
});
