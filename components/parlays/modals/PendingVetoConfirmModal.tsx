import OutstandingVetoCard from "@/components/vetos/OutstandingVetoCard"
import { Modal, View } from "react-native"

type Props = {
    visible: boolean
    veto: import("@/api").PickVetoResponseData
    onCancel: () => void
    onProceed: () => void
}

export default function PendingVetoConfirmModal({ visible, veto, onCancel, onProceed }: Props) {
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onCancel}
        >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View style={{ width: '85%', backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
                    <OutstandingVetoCard
                        veto={veto}
                        pendingTransition="locking-parlay"
                        onCancel={onCancel}
                        onProceed={onProceed}
                    />
                </View>
            </View>
        </Modal>
    )
}