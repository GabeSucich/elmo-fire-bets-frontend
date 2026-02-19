import React from "react"
import { Modal, Text, View } from "react-native"
import ActionButton from "../../reusable/ActionButton"
import { useParlaysContext } from "@/contexts/parlaysContext"

type Props = {
    visible: boolean
    parlayId: number
    onCancel: () => void
}

export default function ReopenParlayModal({ visible, parlayId, onCancel }: Props) {
    const {
        reopenParlay,
        refreshParlays,
        navToTab,
        setFocusedParlayId
    } = useParlaysContext()

    function handleReopen() {
        onCancel()
        reopenParlay(parlayId, () => {
            refreshParlays()
            navToTab("Open")
            setFocusedParlayId(parlayId)
        })
    }

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
                        Reopen Parlay?
                    </Text>
                    <Text style={{ fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 20, textAlign: 'center' }}>
                        Do you want to reopen the parlay? This will require you to re-enter the parlay result in the "Open" tab.
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
                        <ActionButton text="Cancel" onPress={onCancel} color="#e0e0e0" />
                        <ActionButton text="Reopen Parlay" onPress={handleReopen} />
                    </View>
                </View>
            </View>
        </Modal>
    )
}
