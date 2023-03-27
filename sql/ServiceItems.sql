/****** Script for SelectTopNRows command from SSMS  ******/
SELECT TOP (1000) s.[ID]
      ,s.[Code] as code
	  ,g.code as gCode
      ,s.[EngName] as nameEn
      ,s.[ArbName] as nameAr
      ,s.[CashPrice]
      ,s.[CreditPrice]
      ,s.[PackagePrice]
      ,s.[Cost]
      ,s.[CashInPrice]
      ,s.[CreditInPrice]
      ,s.[PharmacyPrice]
      ,s.[ICDServiceID]
      ,s.[Duration]
      ,s.[VAT]
  FROM [hmis].[dbo].[ServiceItems] as s
  inner join ServiceGroups as g
  on s.ServiceGroupID = g.ID