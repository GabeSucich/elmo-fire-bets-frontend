import React from "react"
import { Modal, Text, View } from "react-native"
import ActionButton from "../../reusable/ActionButton"

type Props = {
    visible: boolean
    onCancel: () => void
    onSubmit: () => void
}

export default function UnlockParlayModal({ visible, onCancel, onSubmit }: Props) {
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
                        Unlock Parlay?
                    </Text>
                    <Text style={{ fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 20, textAlign: 'center' }}>
                        Setting this parlay back to the "Building" state will undo all pick corrections that may have been applied and delete all pick results. Any vetoes that were not approved will have to be recreated.
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
                        <ActionButton text="Cancel" onPress={onCancel} color="#e0e0e0" />
                        <ActionButton text="Unlock Parlay" onPress={onSubmit} />
                    </View>
                </View>
            </View>
        </Modal>
    )
}
