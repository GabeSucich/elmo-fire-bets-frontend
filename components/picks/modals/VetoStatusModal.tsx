import { PickResponseData, PickVetoResponseData } from "@/api"
import { Modal, Pressable, Text, View } from "react-native"
import VetoStatusCard from "../../vetos/VetoStatusCard"

type Props = {
    visible: boolean
    onClose: () => void
    pick: PickResponseData
    veto: PickVetoResponseData
    onVoteSubmitted: () => void
    onVetoDeleted: () => void
}

export default function VetoStatusModal({ visible, onClose, pick, veto, onVetoDeleted, onVoteSubmitted }: Props) {
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View style={{ width: '90%', backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
                    <Pressable onPress={onClose}>
                        <Text style={{ fontSize: 18 }}>✕</Text>
                    </Pressable>
                    <VetoStatusCard
                        pick={pick}
                        veto={veto}
                        gamblerId={veto.gambler_id}
                        onDeleteVeto={onVetoDeleted}
                        onSubmitVote={onVoteSubmitted}
                    />
                </View>
            </View>
        </Modal>
    )
}
