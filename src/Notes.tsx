import React from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Note from './components/Note';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TRootStackParamList } from './App';

export interface INote {
	title: string;
	text: string;
}

interface IProps {
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
		const storageKey = 'notes-' + this.props.route.params.user.username;

		//const suffix = this.props.route.params.user.username + '-' + this.props.route.params.user.password;

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
		//const suffix = this.props.route.params.user.username + '-' + this.props.route.params.user.password;

		const storageKey = 'notes-' + this.props.route.params.user.username;

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
		const note: INote = {
			title: this.state.newNoteTitle,
			text: this.state.newNoteEquation
		};

		if (note.title === '' || note.text === '') {
			Alert.alert('Error', 'Title and equation cannot be empty.');
			return;
		}

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
							{'Math Notes: ' + this.props.route.params.user.username}
						</Text>
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