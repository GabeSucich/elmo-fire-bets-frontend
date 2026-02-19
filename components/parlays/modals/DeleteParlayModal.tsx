import React from "react"
import { Modal, Text, View } from "react-native"
import ActionButton from "../../reusable/ActionButton"

type Props = {
    visible: boolean
    onCancel: () => void
    onDelete: () => void
}

export default function DeleteParlayModal({ visible, onCancel, onDelete }: Props) {
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
                        Delete Parlay?
                    </Text>
                    <Text style={{ fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 20, textAlign: 'center' }}>
                        Do you want to delete this parlay? Any associated picks and vetoes will also be deleted.
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
                        <ActionButton text="Cancel" onPress={onCancel} color="#e0e0e0" />
                        <ActionButton text="Delete" onPress={onDelete} color="#dc2626" />
                    </View>
                </View>
            </View>
        </Modal>
    )
}
