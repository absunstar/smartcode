/****** Script for SelectTopNRows command from SSMS  ******/
SELECT TOP (1000) [ID]
      ,[Code] as code
      ,[EngName] as nameEn
      ,[ArbName] as nameAr
      ,[NumDays] as dayCount
  FROM [hmis].[dbo].[ServiceDosageDurations]