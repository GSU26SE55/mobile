import React, { useState } from 'react';
import { StyleSheet, View, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CreateTicketStepper, detectedLabelToIso } from '@/src/features/tickets/components/CreateTicketStepper';
import { CreateTicketSuccess } from '@/src/features/tickets/components/CreateTicketSuccess';
import { useCreateTicket } from '@/src/features/tickets/hooks/useCreateTicket';
import { createTicketSchema } from '@/src/features/tickets/schemas/createTicket.schema';
import { useMyBatteryAssets } from '@/src/features/batteries/hooks/useMyBatteryAssets';
import { TicketCategoryEnum } from '@/src/features/tickets/types/ticket.types';
import type { UploadedTicketAttachment } from '@/src/features/tickets/types/ticket.types';
import { Colors } from '@/src/lib/theme';
import { P } from '@/src/lib/authz';
import { PermissionGuard } from '@/src/features/auth/components/PermissionGuard';

export default function CreateTicketScreen() {
  return (
    <PermissionGuard permission={P.TICKET_CREATE}>
      <CreateTicketScreenInner />
    </PermissionGuard>
  );
}

function CreateTicketScreenInner() {
  const insets = useSafeAreaInsets();
  const { mutateAsync, isPending } = useCreateTicket();
  const { data: batteries = [] } = useMyBatteryAssets();

  const [step, setStep] = useState(1);
  const [selectedBatteryIds, setSelectedBatteryIds] = useState<string[]>([]);
  const [category, setCategory] = useState<TicketCategoryEnum | ''>('');
  const [description, setDescription] = useState('');
  const [detectedLabel, setDetectedLabel] = useState(''); // chip label, or '' if unspecified
  const [attachedFiles, setAttachedFiles] = useState<UploadedTicketAttachment[]>([]);

  const [createdTicketCode, setCreatedTicketCode] = useState<string>('');
  const [createdTicketId, setCreatedTicketId] = useState<string>('');

  const handleCancel = () => {
    Alert.alert(
      'Cancel ticket creation',
      'Are you sure? All entered information will be lost.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Cancel', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  const handleSubmit = async () => {
    // Prevent duplicate creation: skip if already created successfully (has id) or currently submitting.
    if (createdTicketId || isPending) return;

    const categoryLabels: Record<TicketCategoryEnum, string> = {
      Charging: 'Charging Issue',
      Overheat: 'Overheat',
      NoPower: 'No Power',
      Performance: 'Poor Performance',
      Repair: 'Repair Request',
      Other: 'Other Request',
    };

    const catLabel = categoryLabels[category as TicketCategoryEnum] ?? 'Support Request';
    // Title based on battery: 1 battery → "Type - SERIAL"; multiple batteries → "Type - SERIAL +N".
    const firstBattery = batteries.find((b) => b.id === selectedBatteryIds[0]);
    const extra = selectedBatteryIds.length - 1;
    const title = firstBattery
      ? `${catLabel} - ${firstBattery.serialNumber}${extra > 0 ? ` +${extra}` : ''}`
      : catLabel;

    // Validate via schema (mobile rule: manual parse via safeParse) — catch errors
    // locally instead of letting BE return 400 after a round trip.
    const parsed = createTicketSchema.safeParse({
      title,
      description,
      category,
      batteryAssetIds: selectedBatteryIds,
      // GH-866 — BE requires IncidentDetectedAt (a single point in time, not a range).
      // Falls back to now if the user didn't select one. ISO computed at submit time.
      incidentDetectedAt: detectedLabelToIso(detectedLabel) || new Date().toISOString(),
    });
    if (!parsed.success) {
      Alert.alert('Missing information', parsed.error.issues[0].message);
      return;
    }

    try {
      const res = await mutateAsync({
        ...parsed.data,
        attachments: attachedFiles.length > 0
          ? attachedFiles.map((file) => ({
              fileId: file.fileId,
              fileName: file.fileName,
              contentType: file.contentType,
              sizeBytes: file.sizeBytes,
              url: file.url,
            }))
          : undefined,
      });

      const dataDto = res.data?.data;
      if (res.data?.isSuccess && dataDto) {
        setCreatedTicketCode(dataDto.code ?? 'T-SUCCESS');
        setCreatedTicketId(dataDto.id ?? '');
        setStep(5);
      } else {
        throw new Error(res.data?.message ?? 'System error occurred');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not create ticket. Please try again.');
    }
  };

  const handleViewDetails = () => {
    if (createdTicketId) {
      router.replace({
        pathname: '/(customer)/tickets/[id]',
        params: { id: createdTicketId },
      });
    } else {
      router.back();
    }
  };

  const handleBackToList = () => {
    router.dismissAll();
    router.replace('/(customer)/(tabs)/tickets');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {step === 5 ? (
          <CreateTicketSuccess
            ticketCode={createdTicketCode}
            onViewDetails={handleViewDetails}
            onBackToList={handleBackToList}
          />
        ) : (
          <CreateTicketStepper
            step={step}
            setStep={setStep}
            selectedBatteryIds={selectedBatteryIds}
            setSelectedBatteryIds={setSelectedBatteryIds}
            category={category}
            setCategory={setCategory}
            description={description}
            setDescription={setDescription}
            detectedLabel={detectedLabel}
            setDetectedLabel={setDetectedLabel}
            attachedFiles={attachedFiles}
            setAttachedFiles={setAttachedFiles}
            onSubmit={handleSubmit}
            isLoading={isPending}
            onCancel={handleCancel}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});
