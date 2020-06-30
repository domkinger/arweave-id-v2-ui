import React, { useState, useEffect, useRef } from 'react'
import { IonContent, IonApp, IonCard, IonButton, IonGrid, IonItem, IonInput, IonList, IonCardContent, IonLabel, IonRow, IonTextarea, IonText } from '@ionic/react'
import '@ionic/react/css/core.css'
import * as CSS from 'csstype'
import { loadIdentity, IIdData, setIdentity, getUnavailableNames } from './providers/arweave.provider'
import { mdiSend } from '@mdi/js' //material icons: https://materialdesignicons.com/
import { Icon } from '@mdi/react';
import Header from './components/Header'
import Footer from './components/Footer'
import { loadImage } from './providers/imageloader.provider'
import { ArweaveId, getIdenticon, ISetReturn } from 'arweave-id'
import Popover from 'react-tiny-popover'


const App = () => {

	const [disableUpdateButton, setDisableUpdateButton] = useState(true)
	const [address, setAddress] = useState('No address loaded')
	const [name, setName] = useState<string>('');
	const [url, setUrl] = useState<string>('');
	const [text, setText] = useState<string>('');
	const [retrievedID, setID] = useState<ArweaveId>();
	const [avatarDataUri, setAvatarDataUri] = useState<string>()
	const [showModal, setShowModal] = useState<boolean>(false)
	const [unavailableNames, setUnavailableNames] = useState<string[]>()
	const [successModal, setSuccess] = useState<boolean>(false);
	const [postedTxn, setPostedTxn] = useState<string>('');
	const walletFileInput = useRef<HTMLInputElement>(null) 
	const avatarFileInput = useRef<HTMLInputElement>(null) 

	useEffect(() => {
		const getNames = async () => {
			const names = await getUnavailableNames();
			setUnavailableNames(names);
			console.log(names);
		}
		getNames();
	}, [])

	useEffect(() => {
		if ((retrievedID?.name === name) && (retrievedID?.text === text) && (retrievedID?.url === url) && (retrievedID?.avatarDataUri === avatarDataUri)) {
			setDisableUpdateButton(true)
		}
		else {
			setDisableUpdateButton(false)
		}
	}, [name, text, url, avatarDataUri, retrievedID,disableUpdateButton]);

	const onLoadIdentity = async (ev: React.ChangeEvent<HTMLInputElement>) => {
		setName('')
		setAvatarDataUri('')
		try {
			let data: IIdData = await loadIdentity(ev)
			let arid = data.arweaveId
			setAddress(data.address!)
			setName(arid!.name)
			if (arid!.text) setText(arid!.text)
			if (arid!.url) setUrl(arid!.url)
			arid!.avatarDataUri !== undefined && setAvatarDataUri(arid?.avatarDataUri)
			console.log('received data')
			console.log(data.arweaveId)
			setID(arid);
			setDisableUpdateButton(false)
		} catch (err) {
			setDisableUpdateButton(true)
			setAddress('Error: Unable to load wallet')
			console.log('no data received')
		}
	}

	const onChangeAvatar = async (ev: React.ChangeEvent<HTMLInputElement>) => {
		try {
			let dataUri = await loadImage(ev)
			setAvatarDataUri(dataUri)
		} catch (error) {
			alert(error) // replace with <IonToast> or something
		}
	}

	const checkName = (ev: any) => {
		setName(ev.detail.value!)
		if ((retrievedID?.name !== ev.detail.value) && (unavailableNames?.includes(ev.detail.value!))) {
			setShowModal(true)
			setDisableUpdateButton(true)
		}
		else {
			setShowModal(false);
			setDisableUpdateButton(false);
		}
	}

	const openFileInput = (fileInput: any) => {
		if (fileInput.current){
			fileInput.current.click();
		}
	}

	const onUpdateIdentity = async () => {
		let updated: ArweaveId = { name: name!, url: url, text: text }
		if (avatarDataUri !== undefined) {
			updated.avatarDataUri = avatarDataUri
		}
		let res = await setIdentity(updated);
		if (res?.statusCode === 202) {
			setSuccess(true)
			setPostedTxn(res.txid)
			setDisableUpdateButton(true)
		}
	}
	
	return (
		<IonApp>
			<Header />
			<IonContent >

				<IonCard style={mainCardStyle}>
					<IonGrid style={gridStyle}>
					{address && <IonCardContent>
						<IonRow>
						<IonItem >
							<IonLabel>
								{"Wallet: " + address}
							</IonLabel>
						</IonItem>
						<IonButton color='secondary' onClick={() => openFileInput(walletFileInput)}>
							<label style={labelStyle} title='Load Your Arweave Wallet'>
								Load Wallet
							</label>
							<input id='myloadjson' type='file' ref={walletFileInput} onChange={onLoadIdentity} style={hiddenStyle} />
						</IonButton></IonRow>
					</IonCardContent> }
					<IonItem >
						<IonButton shape="round" onClick={() =>{
							let identicon = getIdenticon(name);
							setAvatarDataUri(`${identicon}`)
						}} disabled={name === ''}>
							Generate Avatar &nbsp; 
						</IonButton>	</IonItem>
						<IonCard onClick={() => openFileInput(avatarFileInput)} style={{ ...avatarStyle, backgroundImage: `url('${avatarDataUri}')` }}>
							{!avatarDataUri && (
								svgCircle()
							)}
							<input id='avatarinput' type='file' ref={avatarFileInput} accept='image/*' onChange={onChangeAvatar} style={hiddenStyle} />
						</IonCard>
							

						<IonList>
						<IonItem>
							<Popover
								isOpen={showModal}
								position={'bottom'} // preferred position
								content={<IonCard color='danger' style={{ padding: '10px' }}>Name Not Available</IonCard>}
							>
								<IonInput
									placeholder='enter new name'	
									value={name}
									onIonChange={ev => checkName(ev)}
									onFocus={() => setShowModal(false)}
									style={{ textAlign: 'center' }}
								/>
							</Popover>
							</IonItem>
							<IonItem>
							<IonInput
								placeholder='Enter URL'
								value={url}
								onIonChange={ev => setUrl(ev.detail.value!)}
								style={{ textAlign: 'center' }}
							/></IonItem>
							<IonItem>
							<IonTextarea
								placeholder='Enter any freeform text'
								value={text}
								onIonChange={ev => setText(ev.detail.value!)}
								style={textAreaStyle}
							/></IonItem>
						</IonList>
						<IonRow>
						<Popover
								isOpen={successModal}
								position={'right'} // preferred position
								content={<IonCard color='primary' style={{ padding: '10px' }}>ArweaveID submitted successfully.  See transaction 
								<a href={"https://viewblock.io/arweave/tx/" + postedTxn} target="blank"> here</a></IonCard>}
							>
						<IonButton onClick={onUpdateIdentity} disabled={disableUpdateButton || name === ''}>
							Save &nbsp; <Icon path={mdiSend} size={1} />
						</IonButton></Popover>
						</IonRow>
					</IonGrid>
				</IonCard>
			</IonContent>
			<Footer />
		</IonApp>
	)
}
export default App;


const mainCardStyle: CSS.Properties = {
	height: '80%',
	margin: '10%',
}
const gridStyle: CSS.Properties = {
	height: '100%',
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'start',
	alignItems: 'center',
}
const avatarStyle: CSS.Properties = {
	position: 'relative',
	width: '100%',
	height: '100%',
	maxHeight: '300px',
	maxWidth: '300px',
	overflow: 'hidden',
	backgroundPosition: 'center center',
	backgroundRepeat: 'no-repeat',
	backgroundSize: 'cover',
	textAlign: 'center',
	borderRadius: "50%"
}

const editImageStyle: CSS.Properties = {
	position: 'relative',
	bottom: '10%',
	right: '10%',
	cursor: 'pointer',
	backgroundColor: 'rgba(255, 255, 255, 0.5)',
	borderRadius: '5px',
}

const labelStyle: CSS.Properties = {
	cursor: 'pointer',
	padding: '10px',
}
const hiddenStyle: CSS.Properties = {
	visibility: 'hidden',
	position: 'absolute',
	left: 0,
	top: 0,
	width: '0px',
	height: '0px',
}

const svgStyle: CSS.Properties = {
	height: "200px",
	stroke: "black",
	bottom: '-15%',
	right: '0%'
}

const textAreaStyle: CSS.Properties = {
	textAlign: "left",
	border: "1px solid black",
}

const svgCircle = () => {
	return <svg style={{...editImageStyle, ...svgStyle}} viewBox="0 0 100 100">
	<circle cx="50" cy="50" r="45" fill="none" strokeWidth="7.5"></circle>
	<line x1="32.5" y1="50" x2="67.5" y2="50" strokeWidth="5"></line>
	<line x1="50" y1="32.5" x2="50" y2="67.5" strokeWidth="5"></line>
  </svg>
  
}