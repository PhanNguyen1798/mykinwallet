import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Field, reduxForm, InjectedFormProps } from 'redux-form';
import Template from 'src/components/pageTemplate/template';
import { TransactionContent, GrayedArea, TransactionStyled, HeaderContainer } from './style';
import { H3, Button } from 'common/selectors';
import formInput from 'src/components/formInput/formInput';
import { authFormTheme } from 'style/theme/generalVariables';
import * as Styled from './style';
import WalletInfo from 'src/components/walletInfo/WalletInfo';
import validate from './validation';
import { navigate, Link } from 'gatsby';
import inputFields from './inputFileds.tsx';

interface IFormData {
	destinationAccount?: string;
	kinAmount?: string;
	memo?: string;
}

const Index: React.FunctionComponent<InjectedFormProps<IFormData>> = props => {
	const stepByPath = () => (props.isLedgerConnected ? 3 : 2);
	const outOfByPath = () => (props.isLedgerConnected ? 5 : 4);
	return (
		<Template
			hide="terms"
			step={2}
			outOf={outOfByPath()}
			title={{ main: 'MyKinWallet', sub: ['Send your Kin coins to other wallets, exchanges or users.'], page: 'shared' }}
		>
			<Transaction {...props} />
		</Template>
	);
};

const Transaction: React.FunctionComponent<ITransaction> = ({
	actions,
	store,
	handleSubmit,
	validate,
	initialValues,
	location
}) => {
	const [initial, setInitial] = useState(true);
	const fee = 0.001;
	// TODO: move to localization

	const onSubmit = formValues => {
		let { balance } = store.blockchain.account.balances[0];
		balance = Number(balance);
		const amountPlusFee = Number(formValues.kinAmount) + fee;
		validate(formValues, balance);
		if (balance < amountPlusFee) return actions.setTemplateErrors(['Insufficient funds for the requested transfer']);
		const { destinationAccount, kinAmount, memo } = formValues;
		const account = store.blockchain.publicKey;
		// from: account  to: Destination account   amount:Kin Amount   memo:memo
		actions.getUnsignedTransaction([account, destinationAccount, kinAmount, memo || '']);
		actions.setTransactionDataInput({ destinationAccount, kinAmount, memo });
		setInitial(false);
	};
	useEffect(() => {
		// if publicKey couldnt be retrived
		if (!store.blockchain.publicKey) {
			navigate('/');
			return;
		}
		// retrived user account
		if (!store.blockchain.account) actions.getAccount(store.blockchain.publicKey);
		// if unsigned transaction have been made & its not on page mount
		if (store.blockchain.unsignedTransaction && !initial) navigate('/review-payment');
		if (initial) actions.resetTransactions();
	}, [store.blockchain.account, store.blockchain.unsignedTransaction, store.blockchain.publicKey]);
	useEffect(() => {
		actions.resetTemplateErrors();
	}, []);
	const formFields = inputFields.map(item => <Field key={item.name} {...item} component={formInput} {...authFormTheme} />);
	return (
		<TransactionStyled>
			<TransactionContent>
				<GrayedArea visible={!store.blockchain.account} className="grayedArea" />
				<HeaderContainer>
					<H3>MyKinWallet</H3>
				</HeaderContainer>
				{store.blockchain.account && (
					<WalletInfo
						networkType="Public"
						walletAddress={store.blockchain.publicKey}
						balance={store.blockchain.account.balances[0].balance || 'No balance found'}
						ledgerConnected={store.blockchain.ledgerConnected}
						derivationPath={store.blockchain.derviationPath}
					/>
				)}

				<Styled.formContainer>
					<H3>Send Kin</H3>
					<Styled.form initialValues={initialValues} onSubmit={handleSubmit(onSubmit)}>
						{formFields}
						<Styled.ButtonContainer visible={store.blockchain.account}>
							<Button type="submit">Send Payment</Button>
						</Styled.ButtonContainer>
					</Styled.form>
				</Styled.formContainer>
			</TransactionContent>
			{/** if No account detailes present a back button */}
			<Styled.ButtonContainer visible={!store.blockchain.account}>
				<Link to={store.blockchain.ledgerConnected ? '/ledger' : '/key-access'}>
					<Button>Back</Button>
				</Link>
			</Styled.ButtonContainer>
		</TransactionStyled>
	);
};
const mapStateToProps = state => ({
	initialValues: state.blockchain.transactionForm, // retrieve name from redux store
	isLedgerConnected: state.blockchain.blockchain.ledgerConnected
});

export default connect(mapStateToProps)(
	reduxForm({
		form: 'transactionForm',
		validate
	})(Index)
);

interface ITransaction {
	store: {
		errors: string[];
		blockchain: {
			publicKey: string;
			account: object;
			derviationPath: string;
			unsignedTransaction: object;
			ledgerConnected: boolean;
		};
	};
	actions: {
		getAccount: Function;
		getUnsignedTransaction: Function;
		resetTransactions: Function;
		setTransactionDataInput: Function;
		resetTemplateErrors: Function;
	};
	handleSubmit: Function;
	validate: Function;
	initialValues: Object;
	location: object;
}
