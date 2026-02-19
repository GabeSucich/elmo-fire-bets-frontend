import React from "react"
import { Modal, ScrollView, View } from "react-native"
import ParlayPickCorrections from "../ParlayPickCorrections"
import { ParlayResponseData } from "@/api"
import { useParlaysContext } from "@/contexts/parlaysContext"

type Props = {
    visible: boolean
    dismissModal: () => void
    parlay: ParlayResponseData
}

export default function PickCorrectionsModal({ visible, dismissModal, parlay }: Props) {
    const { refreshParlay } = useParlaysContext()
    function onPickCorrectionDone() {
        refreshParlay(parlay.id)
        dismissModal()
    }
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={dismissModal}
        >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View style={{ width: '85%', maxHeight: '85%', backgroundColor: 'white', borderRadius: 10, padding: 20, alignItems: 'center' }}>
                    <ScrollView style={{ width: '100%' }}>
                        <ParlayPickCorrections parlay={parlay} onDone={onPickCorrectionDone}/>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    )
}