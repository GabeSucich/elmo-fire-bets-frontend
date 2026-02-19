import React from "react"
import { Modal, Text, View } from "react-native"
import ActionButton from "../../reusable/ActionButton"

type Props = {
    visible: boolean
    onCancel: () => void
    onConfirm: () => void
}

export default function LockConfirmModal({ visible, onCancel, onConfirm }: Props) {
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onCancel}
        >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View style={{ width: '85%', backgroundColor: 'white', borderRadius: 10, padding: 20, alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, textAlign: 'center' }}>
                        Ready to lock?
                    </Text>
                    <Text style={{ fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 20, textAlign: 'center' }}>
                        Are you sure you want to lock in this lay? This will not allow any other gamblers to edit their picks, and you will be responsible for entering all corrected bets and lines after placing.{"\n\n"}Ownership may be claimed by another gambler.
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
                        <ActionButton text="Cancel" onPress={onCancel} />
                        <ActionButton text="Lock parlay" onPress={onConfirm} />
                    </View>
                </View>
            </View>
        </Modal>
    )
}