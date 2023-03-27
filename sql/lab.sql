SELECT        dbo.LabForms.Code AS code, dbo.LabForms.EngName AS nameEn, dbo.LabForms.ArbName AS nameAr, dbo.LabFormControls.Caption AS itemName, dbo.LabFormControlsNormalValues.Sex AS gender, 
                         dbo.LabFormControlsNormalValues.AgeDaysFrom AS fromDays, dbo.LabFormControlsNormalValues.AgeDaysTo AS toDays, dbo.LabFormControlsNormalValues.NormalValueFrom AS fromValue, 
                         dbo.LabFormControlsNormalValues.NormalValueTo AS toValue, dbo.LabFormControlsNormalValues.Unit AS unit
FROM            dbo.LabForms INNER JOIN
                         dbo.LabFormControlsGroups ON dbo.LabForms.ID = dbo.LabFormControlsGroups.LabFormID INNER JOIN
                         dbo.LabFormControls ON dbo.LabFormControlsGroups.ID = dbo.LabFormControls.LabFormControlsGroupID INNER JOIN
                         dbo.LabFormControlsNormalValues ON dbo.LabFormControls.ID = dbo.LabFormControlsNormalValues.LabFormControlID