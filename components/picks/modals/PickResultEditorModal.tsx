import { PickResponseData } from "@/api"
import { Modal, Pressable, Text, View } from "react-native"
import PickResultEditor from "../PickResultEditor"

type Props = {
    visible: boolean
    onClose: () => void
    pick: PickResponseData
    onUpdated: (pick: PickResponseData) => void
}

export default function PickResultEditorModal({ visible, onClose, pick, onUpdated }: Props) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View style={{ width: '90%', backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
                    <Pressable onPress={onClose}>
                        <Text style={{ fontSize: 18 }}>✕</Text>
                    </Pressable>
                    <PickResultEditor
                        pick={pick}
                        onUpdated={onUpdated}
                    />
                </View>
            </View>
        </Modal>
    )
}
