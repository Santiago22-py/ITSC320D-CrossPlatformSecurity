import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { reportError } from '../security/reportError';

interface IProps {
	title: string;
	text: string;
}

function safeCalculate(expression: string): number {
	const sanitizedExpression = expression.replace(/\s+/g, '');
	const allowedPattern = /^[0-9+\-*/()]+$/;

	if (!sanitizedExpression || !allowedPattern.test(sanitizedExpression)) {
		throw new Error('Invalid expression');
	}

	const tokens = sanitizedExpression.match(/\d+|[+\-*/()]/g);
	if (!tokens || tokens.join('') !== sanitizedExpression) {
		throw new Error('Invalid expression');
	}

	const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };
	const values: number[] = [];
	const operators: string[] = [];

	const applyOperation = () => {
		const operator = operators.pop();
		const right = values.pop();
		const left = values.pop();

		if (!operator || right === undefined || left === undefined) {
			throw new Error('Invalid expression');
		}

		if (operator === '+') {
			values.push(left + right);
		} else if (operator === '-') {
			values.push(left - right);
		} else if (operator === '*') {
			values.push(left * right);
		} else if (operator === '/') {
			if (right === 0) {
				throw new Error('Division by zero');
			}
			values.push(left / right);
		} else {
			throw new Error('Invalid expression');
		}
	};

	for (const token of tokens) {
		if (/^\d+$/.test(token)) {
			values.push(Number(token));
		} else if (token === '(') {
			operators.push(token);
		} else if (token === ')') {
			while (operators.length && operators[operators.length - 1] !== '(') {
				applyOperation();
			}

			if (operators.pop() !== '(') {
				throw new Error('Mismatched parentheses');
			}
		} else {
			while (
				operators.length &&
				operators[operators.length - 1] !== '(' &&
				precedence[operators[operators.length - 1]] >= precedence[token]
			) {
				applyOperation();
			}
			operators.push(token);
		}
	}

	while (operators.length) {
		if (operators[operators.length - 1] === '(') {
			throw new Error('Mismatched parentheses');
		}
		applyOperation();
	}

	if (values.length !== 1 || Number.isNaN(values[0])) {
		throw new Error('Invalid expression');
	}

	return values[0];
}

function Note(props: IProps) {
	function evaluateEquation() {
		try {
			// SECURITY FIX:
			// eval() was removed because it allows execution of arbitrary code.
			// Input is now validated and sanitized to prevent code injection.
			const result = safeCalculate(props.text);
			Alert.alert('Result', 'Result: ' + result);
		} catch {
			/*
			SECURITY FIX:
			Avoid showing raw error details (e.g., stack traces) in alerts.
			Log only a safe message and show a generic user-facing error to reduce information leakage.
			*/
			reportError();
			Alert.alert('Error', 'Something went wrong. Please try again.');
		}
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>
				{props.title}
			</Text>
			<Text style={styles.text}>
				{props.text}
			</Text>

			<View style={styles.evaluateContainer}>
				<Button title="Evaluate" onPress={evaluateEquation} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 10,
		marginTop: 5,
		marginBottom: 5,
		backgroundColor: '#fff',
		borderRadius: 5,
		borderColor: 'black',
		borderWidth: 1,
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	text: {
		fontSize: 16,
	},
	evaluateContainer: {
		marginTop: 10,
		marginBottom: 10,
	},
});

export default Note;
