import React from "react"
import { Modal, Pressable, ScrollView, Text, View } from "react-native"
import ParlayFinalization from "../ParlayFinalization"
import { ParlayResponseData } from "@/api"

type Props = {
    visible: boolean
    dismissModal: () => void
    parlay: ParlayResponseData
}

export default function ParlayFinalizationModal({ visible, dismissModal, parlay }: Props) {
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={dismissModal}
        >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View style={{ width: '90%', maxHeight: '85%', backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
                    <Pressable onPress={dismissModal}>
                        <Text style={{ fontSize: 18 }}>✕</Text>
                    </Pressable>
                    <ScrollView style={{ width: '100%' }}>
                        <ParlayFinalization parlay={parlay} onDone={dismissModal} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    )
}
