import { PickResponseData } from "@/api"
import { Modal, Pressable, Text, View } from "react-native"
import CreateVetoCard from "../../vetos/CreateVetoCard"

type Props = {
    visible: boolean
    onClose: () => void
    pick: PickResponseData
    onVetoCreated: () => void
}

export default function PickVetoModal({ visible, onClose, pick, onVetoCreated }: Props) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View style={{ width: '90%', backgroundColor: 'white', borderRadius: 10, padding: 10 }}>
                    <Pressable onPress={onClose}>
                        <Text style={{ fontSize: 18, marginBottom: 10 }}>✕</Text>
                    </Pressable>
                    <CreateVetoCard
                        pick={pick}
                        onVetoCreated={onVetoCreated}
                    />
                </View>
            </View>
        </Modal>
    )
}
