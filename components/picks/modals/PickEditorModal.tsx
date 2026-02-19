import { PickResponseData } from "@/api"
import { Modal, Pressable, Text, View } from "react-native"
import GamblerPickEditor from "../GamblerPickEditor"

type Props = {
    visible: boolean
    onClose: () => void
    pick: PickResponseData | null
    onPickSaved: () => void
    parlayId: number
    gamblerId: number
}

export default function PickEditorModal({ visible, onClose, pick, onPickSaved, parlayId, gamblerId }: Props) {
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
                    {
                        <GamblerPickEditor
                            pick={pick}
                            onPickSaved={onPickSaved}
                            parlayId={parlayId}
                            gamblerId={gamblerId}
                        />
                    }
                </View>
            </View>
        </Modal>
    )
}
